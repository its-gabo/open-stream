import {
  ACTIVITY_ACTIONS,
  ORGANIZATION_DELETE_CONFIRMATION_PHRASE,
  ORGANIZATION_ROLES,
  ORGANIZATION_STATUSES,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { SYSTEM_ACTIVITY_ACTOR } from "../../activity/utils/activity-actor.utils"
import type { AuthTokenService } from "../../auth/services/auth-token.service"
import type { AuthUserSession } from "../../auth/types/auth.types"
import { DomainError } from "../../common/errors/domain-error"
import { DAY_MS } from "../../common/time/time.constants"
import type { Transaction } from "../../db/database.types"
import type {
  OrganizationDeletionRequestRecord,
  OrganizationRecord,
} from "../../db/schema"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import {
  ORGANIZATION_DELETION_ACTIONS,
  ORGANIZATION_DELETION_DELAY_DAYS,
  ORGANIZATION_DELETION_SWEEP_BATCH_SIZE,
} from "../constants/organizations.constants"
import { toOrganizationSummaryDto } from "../dto/organizations.dto.mappers"
import type { OrganizationDeletionScheduleBody } from "../dto/organizations.schemas"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsRepository } from "../repository/organizations.repository"
import type {
  OrganizationAccess,
  OrganizationFilesCleanup,
  OrganizationMember,
  OrganizationPerson,
} from "../types/organizations.types"
import { organizationActivityResource } from "../utils/organization-activity.utils"
import { lockActiveOrganization } from "../utils/organization-locks.utils"
import type { OrganizationActionLinkService } from "./organization-action-link.service"
import type { OrganizationEmailService } from "./organization-email.service"

/**
 * Deleting an organization is two-step: scheduling disables it right away and
 * emails the owner links to cancel or delete now; otherwise the worker deletes
 * it once the grace period ends.
 */
export class OrganizationDeletionService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly outboxService: OutboxService,
    private readonly authTokenService: AuthTokenService,
    private readonly organizationActionLinkService: OrganizationActionLinkService,
    private readonly organizationEmailService: OrganizationEmailService,
    private readonly activityLogService: ActivityLogService,
    private readonly organizationFilesCleanup: OrganizationFilesCleanup
  ) {}

  async scheduleDeletion(
    access: OrganizationAccess,
    session: AuthUserSession,
    actor: ActivityActor,
    input: OrganizationDeletionScheduleBody
  ) {
    if (
      input.confirmationPhrase.trim() !==
      ORGANIZATION_DELETE_CONFIRMATION_PHRASE
    ) {
      throw new DomainError(ORGANIZATION_ERRORS.CONFIRMATION_MISMATCH)
    }

    const delayMs = ORGANIZATION_DELETION_DELAY_DAYS * DAY_MS
    const cancelToken = this.authTokenService.prepareTokenWithExpiry(delayMs)
    const deleteToken = this.authTokenService.prepareTokenWithExpiry(delayMs)

    return this.organizationsRepository.transaction(async (transaction) => {
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )

      if (input.organizationName.trim() !== organization.name) {
        throw new DomainError(ORGANIZATION_ERRORS.CONFIRMATION_MISMATCH)
      }

      await this.assertOwner(organization.id, session.userId, transaction)

      const request = await this.organizationsRepository.insertDeletionRequest(
        {
          organizationId: organization.id,
          scheduledByUserId: session.userId,
          scheduledFor: cancelToken.expiresAt,
          cancelTokenHash: cancelToken.tokenHash,
          deleteTokenHash: deleteToken.tokenHash,
        },
        transaction
      )

      if (!request) throw new DomainError(ORGANIZATION_ERRORS.PENDING_DELETION)

      await this.organizationsRepository.updateOrganization(
        organization.id,
        { status: ORGANIZATION_STATUSES.PENDING_DELETION },
        transaction
      )

      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: organization.id,
          action: ACTIVITY_ACTIONS.ORGANIZATION_DELETION_SCHEDULED,
          resource: organizationActivityResource(organization),
          before: { status: organization.status },
          after: {
            status: ORGANIZATION_STATUSES.PENDING_DELETION,
            scheduledFor: request.scheduledFor.toISOString(),
          },
        },
        transaction
      )

      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
        this.organizationEmailService.composeDeletionScheduledEmail({
          email: session.email,
          organizationName: organization.name,
          scheduledFor: request.scheduledFor,
          cancelUrl: this.organizationActionLinkService.buildDeletionActionUrl(
            ORGANIZATION_DELETION_ACTIONS.CANCEL,
            cancelToken.rawToken
          ),
          deleteUrl: this.organizationActionLinkService.buildDeletionActionUrl(
            ORGANIZATION_DELETION_ACTIONS.DELETE,
            deleteToken.rawToken
          ),
        }),
        transaction
      )

      return {
        organization: toOrganizationSummaryDto({
          ...organization,
          status: ORGANIZATION_STATUSES.PENDING_DELETION,
          scheduledDeletionAt: request.scheduledFor,
        }),
      }
    })
  }

  /** Cancels from the organization settings, without the emailed link. */
  async cancelDeletion(
    access: OrganizationAccess,
    session: AuthUserSession,
    actor: ActivityActor
  ) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const organization = await this.organizationsRepository.lockOrganization(
        access.organization.id,
        transaction
      )

      const request = organization
        ? await this.organizationsRepository.findDeletionRequestOfOrganization(
            organization.id,
            transaction
          )
        : null

      if (!organization || !request) {
        throw new DomainError(ORGANIZATION_ERRORS.DELETION_NOT_SCHEDULED)
      }

      const owner = await this.assertOwner(
        organization.id,
        session.userId,
        transaction
      )

      await this.restoreOrganization(
        organization,
        request,
        owner,
        actor,
        transaction
      )
    })
  }

  /** Cancels through the emailed link; it works only for the owner who is signed in. */
  async cancelDeletionByToken(
    session: AuthUserSession,
    actor: ActivityActor,
    rawToken: string
  ) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const { request, organization, owner } = await this.resolveDeletionAction(
        await this.organizationsRepository.lockDeletionRequestByCancelTokenHash(
          this.authTokenService.hashToken(rawToken),
          transaction
        ),
        session,
        transaction
      )

      await this.restoreOrganization(
        organization,
        request,
        owner,
        actor,
        transaction
      )
    })
  }

  /** Deletes right away through the emailed link; it works only for the owner who is signed in. */
  async deleteOrganizationByToken(
    session: AuthUserSession,
    actor: ActivityActor,
    rawToken: string
  ) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const { request, organization, owner } = await this.resolveDeletionAction(
        await this.organizationsRepository.lockDeletionRequestByDeleteTokenHash(
          this.authTokenService.hashToken(rawToken),
          transaction
        ),
        session,
        transaction
      )

      await this.deleteOrganization(
        organization,
        request,
        owner,
        actor,
        transaction
      )
    })
  }

  /** Permanently deletes one batch of organizations whose grace period ended; returns how many. */
  async deleteDueOrganizations() {
    return this.organizationsRepository.transaction(async (transaction) => {
      const requests =
        await this.organizationsRepository.claimDueDeletionRequests(
          ORGANIZATION_DELETION_SWEEP_BATCH_SIZE,
          transaction
        )

      for (const request of requests) {
        const organization =
          await this.organizationsRepository.lockOrganization(
            request.organizationId,
            transaction
          )

        if (!organization) continue

        const owner = await this.organizationsRepository.findOwner(
          organization.id,
          transaction
        )

        await this.deleteOrganization(
          organization,
          request,
          owner,
          SYSTEM_ACTIVITY_ACTOR,
          transaction
        )
      }

      return requests.length
    })
  }

  private async assertOwner(
    organizationId: string,
    userId: string,
    transaction: Transaction
  ) {
    const membership = await this.organizationsRepository.findMembershipOfUser(
      organizationId,
      userId,
      transaction
    )

    if (membership?.role !== ORGANIZATION_ROLES.OWNER) {
      throw new DomainError(ORGANIZATION_ERRORS.OWNER_REQUIRED)
    }

    return membership
  }

  /** Validates an emailed deletion link: unexpired, and used by the organization's owner. */
  private async resolveDeletionAction(
    request: OrganizationDeletionRequestRecord | null,
    session: AuthUserSession,
    transaction: Transaction
  ): Promise<{
    request: OrganizationDeletionRequestRecord
    organization: OrganizationRecord
    owner: OrganizationMember
  }> {
    if (!request || request.scheduledFor <= new Date()) {
      throw new DomainError(ORGANIZATION_ERRORS.INVALID_DELETION_ACTION)
    }

    const organization = await this.organizationsRepository.lockOrganization(
      request.organizationId,
      transaction
    )
    const owner = await this.organizationsRepository.findOwner(
      request.organizationId,
      transaction
    )

    if (!organization || owner?.userId !== session.userId) {
      throw new DomainError(ORGANIZATION_ERRORS.INVALID_DELETION_ACTION)
    }

    return { request, organization, owner }
  }

  private async restoreOrganization(
    organization: OrganizationRecord,
    request: OrganizationDeletionRequestRecord,
    owner: OrganizationPerson,
    actor: ActivityActor,
    transaction: Transaction
  ) {
    await this.organizationsRepository.deleteDeletionRequest(
      request.id,
      transaction
    )

    await this.organizationsRepository.updateOrganization(
      organization.id,
      { status: ORGANIZATION_STATUSES.ACTIVE },
      transaction
    )

    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: organization.id,
        action: ACTIVITY_ACTIONS.ORGANIZATION_DELETION_CANCELED,
        resource: organizationActivityResource(organization),
        before: {
          status: organization.status,
          scheduledFor: request.scheduledFor.toISOString(),
        },
        after: { status: ORGANIZATION_STATUSES.ACTIVE },
      },
      transaction
    )

    await this.outboxService.publishMessage(
      OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
      this.organizationEmailService.composeDeletionCanceledEmail(
        owner,
        organization.name
      ),
      transaction
    )
  }

  /**
   * Everything of the organization goes with it (cascade); the files of its
   * videos are removed from storage by the worker afterwards.
   */
  private async deleteOrganization(
    organization: OrganizationRecord,
    request: OrganizationDeletionRequestRecord,
    owner: OrganizationMember | null,
    actor: ActivityActor,
    transaction: Transaction
  ) {
    await this.organizationFilesCleanup.scheduleOrganizationFilesRemoval(
      organization.id,
      transaction
    )

    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: organization.id,
        accountUserId: owner?.userId ?? null,
        action: ACTIVITY_ACTIONS.ORGANIZATION_DELETED,
        resource: organizationActivityResource(organization),
        before: { name: organization.name, slug: organization.slug },
        context: {
          scheduledFor: request.scheduledFor.toISOString(),
          scheduledByUserId: request.scheduledByUserId,
        },
      },
      transaction
    )

    await this.organizationsRepository.deleteOrganization(
      organization.id,
      transaction
    )

    if (owner) {
      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
        this.organizationEmailService.composeDeletedEmail(
          owner,
          organization.name
        ),
        transaction
      )
    }
  }
}
