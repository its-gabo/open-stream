import {
  ACTIVITY_ACTIONS,
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_MEMBERSHIP_LIMIT,
  ORGANIZATION_ROLES,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import type { AuthUserSession } from "../../auth/types/auth.types"
import { DomainError } from "../../common/errors/domain-error"
import type { Transaction } from "../../db/database.types"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import { toOrganizationSummaryDto } from "../dto/organizations.dto.mappers"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsRepository } from "../repository/organizations.repository"
import { invitationActivityResource } from "../utils/organization-activity.utils"
import { lockActiveOrganization } from "../utils/organization-locks.utils"
import type { OrganizationEmailService } from "./organization-email.service"

/** The invitee's side of an invitation: accepting or declining it. */
export class OrganizationInvitationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly outboxService: OutboxService,
    private readonly organizationEmailService: OrganizationEmailService,
    private readonly activityLogService: ActivityLogService
  ) {}

  /** Joins the organization as a member, selects it and notifies the owner. */
  async acceptInvitation(
    session: AuthUserSession,
    actor: ActivityActor,
    invitationId: string
  ) {
    return this.organizationsRepository.transaction(async (transaction) => {
      await this.organizationsRepository.lockUser(session.userId, transaction)

      const invitation = await this.lockPendingInvitation(
        session,
        invitationId,
        transaction
      )
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        invitation.organizationId,
        transaction
      )
      const membershipCount =
        await this.organizationsRepository.countMemberships(
          session.userId,
          transaction
        )

      if (membershipCount >= ORGANIZATION_MEMBERSHIP_LIMIT) {
        throw new DomainError(ORGANIZATION_ERRORS.MEMBERSHIP_LIMIT_REACHED)
      }

      const membership = await this.organizationsRepository.insertMembership(
        {
          organizationId: organization.id,
          userId: session.userId,
          role: ORGANIZATION_ROLES.MEMBER,
          lastSelectedAt: new Date(),
        },
        transaction
      )

      if (!membership) throw new DomainError(ORGANIZATION_ERRORS.ALREADY_MEMBER)

      await this.organizationsRepository.updateInvitation(
        invitation.id,
        { status: ORGANIZATION_INVITATION_STATUSES.ACCEPTED },
        transaction
      )
      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: organization.id,
          action: ACTIVITY_ACTIONS.INVITATION_ACCEPTED,
          resource: invitationActivityResource(invitation),
          before: { status: invitation.status },
          after: {
            status: ORGANIZATION_INVITATION_STATUSES.ACCEPTED,
            membershipId: membership.id,
          },
        },
        transaction
      )

      const owner = await this.organizationsRepository.findOwner(
        organization.id,
        transaction
      )

      if (owner) {
        await this.outboxService.publishMessage(
          OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
          this.organizationEmailService.composeInvitationAcceptedEmail(
            owner,
            organization.name,
            session.name
          ),
          transaction
        )
      }

      return {
        organization: toOrganizationSummaryDto({
          ...organization,
          scheduledDeletionAt: null,
        }),
      }
    })
  }

  async declineInvitation(
    session: AuthUserSession,
    actor: ActivityActor,
    invitationId: string
  ) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const invitation = await this.lockPendingInvitation(
        session,
        invitationId,
        transaction
      )

      await this.organizationsRepository.updateInvitation(
        invitation.id,
        { status: ORGANIZATION_INVITATION_STATUSES.DECLINED },
        transaction
      )
      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: invitation.organizationId,
          action: ACTIVITY_ACTIONS.INVITATION_DECLINED,
          resource: invitationActivityResource(invitation),
          before: { status: invitation.status },
          after: { status: ORGANIZATION_INVITATION_STATUSES.DECLINED },
        },
        transaction
      )
    })
  }

  /** Locks an invitation addressed to the signed-in user that can still be answered. */
  private async lockPendingInvitation(
    session: AuthUserSession,
    invitationId: string,
    transaction: Transaction
  ) {
    const invitation = await this.organizationsRepository.lockInvitation(
      invitationId,
      transaction
    )

    if (invitation?.status !== ORGANIZATION_INVITATION_STATUSES.PENDING) {
      throw new DomainError(ORGANIZATION_ERRORS.INVITATION_UNAVAILABLE)
    }

    if (invitation.email !== session.email) {
      throw new DomainError(ORGANIZATION_ERRORS.INVITATION_EMAIL_MISMATCH)
    }

    if (invitation.expiresAt <= new Date()) {
      throw new DomainError(ORGANIZATION_ERRORS.INVITATION_EXPIRED)
    }

    return invitation
  }
}
