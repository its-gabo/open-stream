import {
  ACTIVITY_ACTIONS,
  ORGANIZATION_FIELD_LIMITS,
  ORGANIZATION_MEMBERSHIP_LIMIT,
  ORGANIZATION_ROLES,
  isValidOrganizationSlug,
  normalizeOrganizationSlug,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import type { AuthUserSession } from "../../auth/types/auth.types"
import { DomainError } from "../../common/errors/domain-error"
import { isUniqueViolation } from "../../db/database.utils"
import {
  toOrganizationMembershipDto,
  toOrganizationSummaryDto,
} from "../dto/organizations.dto.mappers"
import type {
  OrganizationContextDto,
  OrganizationCreateBody,
  OrganizationUpdateBody,
} from "../dto/organizations.schemas"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsRepository } from "../repository/organizations.repository"
import type { OrganizationAccess } from "../types/organizations.types"
import { organizationActivityResource } from "../utils/organization-activity.utils"
import { lockActiveOrganization } from "../utils/organization-locks.utils"
import {
  FALLBACK_SLUG,
  MAX_SLUG_SUFFIX,
} from "../constants/organizations.constants"

export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  findAccess(userId: string, slug: string) {
    return this.organizationsRepository.findAccessBySlug(userId, slug)
  }

  async getContext(session: AuthUserSession): Promise<OrganizationContextDto> {
    const [memberships, pendingInvitations] = await Promise.all([
      this.organizationsRepository.listMembershipsOfUser(session.userId),
      this.organizationsRepository.listPendingInvitationsForEmail(
        session.email
      ),
    ])

    return {
      memberships: memberships.map((membership) => ({
        ...toOrganizationMembershipDto(membership),
        organization: toOrganizationSummaryDto(membership.organization),
      })),
      pendingInvitations: pendingInvitations.map((invitation) => ({
        invitationId: invitation.invitationId,
        expiresAt: invitation.expiresAt.toISOString(),
        organization: toOrganizationSummaryDto(invitation.organization),
      })),
      membershipLimit: {
        used: memberships.length,
        maximum: ORGANIZATION_MEMBERSHIP_LIMIT,
        reached: memberships.length >= ORGANIZATION_MEMBERSHIP_LIMIT,
      },
    }
  }

  /** A free slug derived from the name, numbered when the plain one is taken or reserved. */
  async suggestSlug(name: string) {
    const normalizedName = normalizeOrganizationSlug(name)
    const baseSlug = (
      normalizedName.length >= ORGANIZATION_FIELD_LIMITS.SLUG_MIN_LENGTH
        ? normalizedName
        : [normalizedName, FALLBACK_SLUG].filter(Boolean).join("-")
    )
      .slice(
        0,
        ORGANIZATION_FIELD_LIMITS.SLUG_MAX_LENGTH - `-${MAX_SLUG_SUFFIX}`.length
      )
      .replace(/-+$/, "")

    for (let suffix = 1; suffix <= MAX_SLUG_SUFFIX; suffix += 1) {
      const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`

      if (
        isValidOrganizationSlug(candidate) &&
        !(await this.organizationsRepository.slugExists(candidate))
      ) {
        return candidate
      }
    }

    throw new DomainError(ORGANIZATION_ERRORS.SLUG_TAKEN)
  }

  /** Creates the organization with the caller as its owner and selects it. */
  async createOrganization(
    session: AuthUserSession,
    actor: ActivityActor,
    input: OrganizationCreateBody
  ) {
    return this.organizationsRepository.transaction(async (transaction) => {
      await this.organizationsRepository.lockUser(session.userId, transaction)

      const membershipCount =
        await this.organizationsRepository.countMemberships(
          session.userId,
          transaction
        )

      if (membershipCount >= ORGANIZATION_MEMBERSHIP_LIMIT) {
        throw new DomainError(ORGANIZATION_ERRORS.MEMBERSHIP_LIMIT_REACHED)
      }

      const organization =
        await this.organizationsRepository.insertOrganization(
          input,
          transaction
        )

      if (!organization) throw new DomainError(ORGANIZATION_ERRORS.SLUG_TAKEN)

      const membership = await this.organizationsRepository.insertMembership(
        {
          organizationId: organization.id,
          userId: session.userId,
          role: ORGANIZATION_ROLES.OWNER,
          lastSelectedAt: new Date(),
        },
        transaction
      )

      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: organization.id,
          action: ACTIVITY_ACTIONS.ORGANIZATION_CREATED,
          resource: organizationActivityResource(organization),
          after: { name: organization.name, slug: organization.slug },
        },
        transaction
      )

      return {
        organization: toOrganizationSummaryDto({
          ...organization,
          scheduledDeletionAt: null,
        }),
        membership: {
          // A brand-new organization has no members to conflict with.
          membershipId: membership!.id,
          role: ORGANIZATION_ROLES.OWNER,
        },
      }
    })
  }

  async getOrganization(access: OrganizationAccess) {
    const organization =
      await this.organizationsRepository.findOrganizationDetail(
        access.organization.id
      )

    if (!organization) throw new DomainError(ORGANIZATION_ERRORS.NOT_FOUND)

    return {
      organization: {
        ...toOrganizationSummaryDto(organization),
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      },
      membership: toOrganizationMembershipDto(access),
    }
  }

  async updateOrganization(
    access: OrganizationAccess,
    actor: ActivityActor,
    input: OrganizationUpdateBody
  ) {
    try {
      return await this.organizationsRepository.transaction(
        async (transaction) => {
          const before = await lockActiveOrganization(
            this.organizationsRepository,
            access.organization.id,
            transaction
          )
          const organization =
            await this.organizationsRepository.updateOrganization(
              access.organization.id,
              input,
              transaction
            )

          await this.activityLogService.recordActivity(
            actor,
            {
              organizationId: access.organization.id,
              action: ACTIVITY_ACTIONS.ORGANIZATION_UPDATED,
              resource: organizationActivityResource(organization!),
              ...diffActivityValues(
                { name: before.name, slug: before.slug },
                { name: organization!.name, slug: organization!.slug }
              ),
            },
            transaction
          )

          return {
            organization: toOrganizationSummaryDto({
              ...organization!,
              scheduledDeletionAt: null,
            }),
          }
        }
      )
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(ORGANIZATION_ERRORS.SLUG_TAKEN)
      }

      throw error
    }
  }

  selectOrganization(access: OrganizationAccess) {
    return this.organizationsRepository.markMembershipSelected(
      access.membershipId
    )
  }
}
