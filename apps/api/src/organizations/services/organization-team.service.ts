import {
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_MEMBERSHIP_LIMIT,
  ORGANIZATION_ROLES,
} from "@workspace/shared"
import type { AuthUserSession } from "../../auth/types/auth.types"
import { DomainError } from "../../common/errors/domain-error"
import { DAY_MS } from "../../common/time/time.constants"
import type { Transaction } from "../../db/database.types"
import { isUniqueViolation } from "../../db/database.utils"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import { ORGANIZATION_INVITATION_TTL_DAYS } from "../constants/organizations.constants"
import { toOrganizationTeamInvitationDto } from "../dto/organizations.dto.mappers"
import type {
  OrganizationInvitationCreateBody,
  OrganizationOwnershipTransferBody,
  OrganizationTeamDto,
} from "../dto/organizations.schemas"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsRepository } from "../repository/organizations.repository"
import type { OrganizationAccess } from "../types/organizations.types"
import { lockActiveOrganization } from "../utils/organization-locks.utils"
import type { OrganizationActionLinkService } from "./organization-action-link.service"
import type { OrganizationEmailService } from "./organization-email.service"

/** Membership changes made inside an organization: invitations, removals, leaving and ownership. */
export class OrganizationTeamService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly outboxService: OutboxService,
    private readonly organizationEmailService: OrganizationEmailService,
    private readonly organizationActionLinkService: OrganizationActionLinkService
  ) {}

  /** Every member; invitations only for the owner. */
  async getTeam(access: OrganizationAccess): Promise<OrganizationTeamDto> {
    const isOwner = access.role === ORGANIZATION_ROLES.OWNER
    const [members, invitations] = await Promise.all([
      this.organizationsRepository.listTeamMembers(access.organization.id),
      isOwner
        ? this.organizationsRepository.listOpenInvitations(
            access.organization.id
          )
        : [],
    ])

    return {
      members: members.map(({ membershipId, userId, name, email, role }) => ({
        membershipId,
        userId,
        name,
        email,
        role,
      })),
      invitations: invitations.map(toOrganizationTeamInvitationDto),
    }
  }

  async inviteMember(
    access: OrganizationAccess,
    session: AuthUserSession,
    input: OrganizationInvitationCreateBody
  ) {
    return this.organizationsRepository.transaction(async (transaction) => {
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )

      // A stale pending invitation would otherwise block the new one.
      await this.organizationsRepository.expireInvitations(
        { organizationId: organization.id, email: input.email },
        transaction
      )

      const inviteeId = await this.organizationsRepository.findUserIdByEmail(
        input.email,
        transaction
      )

      if (inviteeId) {
        await this.assertCanJoin(organization.id, inviteeId, transaction)
      }

      const invitation = await this.organizationsRepository.insertInvitation(
        {
          organizationId: organization.id,
          email: input.email,
          inviterId: session.userId,
          expiresAt: this.invitationExpiry(),
        },
        transaction
      )

      if (!invitation) {
        throw new DomainError(ORGANIZATION_ERRORS.INVITATION_ALREADY_PENDING)
      }

      await this.publishInvitationEmail(
        invitation,
        organization.name,
        session.name,
        transaction
      )

      return { invitation: toOrganizationTeamInvitationDto(invitation) }
    })
  }

  /** Re-sends a pending or expired invitation with a fresh expiry. */
  async resendInvitation(
    access: OrganizationAccess,
    session: AuthUserSession,
    invitationId: string
  ) {
    try {
      return await this.renewInvitation(access, session, invitationId)
    } catch (error) {
      // An expired invitation cannot be renewed while a newer one to the same email is pending.
      if (isUniqueViolation(error)) {
        throw new DomainError(ORGANIZATION_ERRORS.INVITATION_ALREADY_PENDING)
      }

      throw error
    }
  }

  async cancelInvitation(access: OrganizationAccess, invitationId: string) {
    await this.organizationsRepository.transaction(async (transaction) => {
      await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )

      const invitation = await this.lockOpenInvitation(
        access.organization.id,
        invitationId,
        transaction
      )

      await this.organizationsRepository.updateInvitation(
        invitation.id,
        { status: ORGANIZATION_INVITATION_STATUSES.CANCELED },
        transaction
      )
    })
  }

  /** Removes a member; the owner cannot be removed, only replaced by a transfer. */
  async removeMember(access: OrganizationAccess, membershipId: string) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )
      const member = await this.organizationsRepository.findMembership(
        organization.id,
        membershipId,
        transaction
      )

      if (member?.role !== ORGANIZATION_ROLES.MEMBER) {
        throw new DomainError(ORGANIZATION_ERRORS.MEMBER_NOT_FOUND)
      }

      await this.organizationsRepository.deleteMembership(
        member.membershipId,
        transaction
      )
      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
        this.organizationEmailService.composeMemberRemovedEmail(
          member,
          organization.name
        ),
        transaction
      )
    })
  }

  async leaveOrganization(
    access: OrganizationAccess,
    session: AuthUserSession
  ) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )
      const membership =
        await this.organizationsRepository.findMembershipOfUser(
          organization.id,
          session.userId,
          transaction
        )

      if (!membership) throw new DomainError(ORGANIZATION_ERRORS.NOT_FOUND)

      if (membership.role === ORGANIZATION_ROLES.OWNER) {
        throw new DomainError(ORGANIZATION_ERRORS.OWNER_CANNOT_LEAVE)
      }

      const owner = await this.organizationsRepository.findOwner(
        organization.id,
        transaction
      )

      await this.organizationsRepository.deleteMembership(
        membership.membershipId,
        transaction
      )

      if (owner) {
        await this.outboxService.publishMessage(
          OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
          this.organizationEmailService.composeMemberLeftEmail(
            owner,
            organization.name,
            membership.name
          ),
          transaction
        )
      }
    })
  }

  /** Makes a member the owner and the current owner a member; confirmed by typing the organization name. */
  async transferOwnership(
    access: OrganizationAccess,
    session: AuthUserSession,
    input: OrganizationOwnershipTransferBody
  ) {
    await this.organizationsRepository.transaction(async (transaction) => {
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )

      if (input.organizationName.trim() !== organization.name) {
        throw new DomainError(ORGANIZATION_ERRORS.CONFIRMATION_MISMATCH)
      }

      const [currentOwner, recipient] = await Promise.all([
        this.organizationsRepository.findMembershipOfUser(
          organization.id,
          session.userId,
          transaction
        ),
        this.organizationsRepository.findMembership(
          organization.id,
          input.membershipId,
          transaction
        ),
      ])

      if (currentOwner?.role !== ORGANIZATION_ROLES.OWNER) {
        throw new DomainError(ORGANIZATION_ERRORS.OWNER_REQUIRED)
      }

      if (recipient?.role !== ORGANIZATION_ROLES.MEMBER) {
        throw new DomainError(ORGANIZATION_ERRORS.INVALID_OWNERSHIP_RECIPIENT)
      }

      // Demote first: only one owner per organization is allowed at any time.
      await this.organizationsRepository.setMembershipRole(
        currentOwner.membershipId,
        ORGANIZATION_ROLES.MEMBER,
        transaction
      )
      await this.organizationsRepository.setMembershipRole(
        recipient.membershipId,
        ORGANIZATION_ROLES.OWNER,
        transaction
      )

      for (const email of this.organizationEmailService.composeOwnershipTransferEmails(
        currentOwner,
        recipient,
        organization.name
      )) {
        await this.outboxService.publishMessage(
          OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
          email,
          transaction
        )
      }
    })
  }

  private renewInvitation(
    access: OrganizationAccess,
    session: AuthUserSession,
    invitationId: string
  ) {
    return this.organizationsRepository.transaction(async (transaction) => {
      const organization = await lockActiveOrganization(
        this.organizationsRepository,
        access.organization.id,
        transaction
      )
      const invitation = await this.lockOpenInvitation(
        organization.id,
        invitationId,
        transaction
      )
      const inviteeId = await this.organizationsRepository.findUserIdByEmail(
        invitation.email,
        transaction
      )

      if (inviteeId) {
        await this.assertCanJoin(organization.id, inviteeId, transaction)
      }

      const renewedInvitation =
        await this.organizationsRepository.updateInvitation(
          invitation.id,
          {
            status: ORGANIZATION_INVITATION_STATUSES.PENDING,
            expiresAt: this.invitationExpiry(),
          },
          transaction
        )

      await this.publishInvitationEmail(
        renewedInvitation!,
        organization.name,
        session.name,
        transaction
      )

      return { invitation: toOrganizationTeamInvitationDto(renewedInvitation!) }
    })
  }

  /** Rejects inviting an existing member or a user who cannot join more organizations. */
  private async assertCanJoin(
    organizationId: string,
    userId: string,
    transaction: Transaction
  ) {
    const existingMembership =
      await this.organizationsRepository.findMembershipOfUser(
        organizationId,
        userId,
        transaction
      )

    if (existingMembership) {
      throw new DomainError(ORGANIZATION_ERRORS.ALREADY_MEMBER)
    }

    const membershipCount = await this.organizationsRepository.countMemberships(
      userId,
      transaction
    )

    if (membershipCount >= ORGANIZATION_MEMBERSHIP_LIMIT) {
      throw new DomainError(ORGANIZATION_ERRORS.MEMBERSHIP_LIMIT_REACHED)
    }
  }

  private async lockOpenInvitation(
    organizationId: string,
    invitationId: string,
    transaction: Transaction
  ) {
    const invitation = await this.organizationsRepository.lockInvitation(
      invitationId,
      transaction
    )
    const isOpen =
      invitation?.status === ORGANIZATION_INVITATION_STATUSES.PENDING ||
      invitation?.status === ORGANIZATION_INVITATION_STATUSES.EXPIRED

    if (
      !invitation ||
      invitation.organizationId !== organizationId ||
      !isOpen
    ) {
      throw new DomainError(ORGANIZATION_ERRORS.INVITATION_NOT_FOUND)
    }

    return invitation
  }

  private invitationExpiry() {
    return new Date(Date.now() + ORGANIZATION_INVITATION_TTL_DAYS * DAY_MS)
  }

  private publishInvitationEmail(
    invitation: { id: string; email: string },
    organizationName: string,
    inviterName: string,
    transaction: Transaction
  ) {
    return this.outboxService.publishMessage(
      OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
      this.organizationEmailService.composeInvitationEmail({
        email: invitation.email,
        organizationName,
        inviterName,
        invitationUrl: this.organizationActionLinkService.buildInvitationUrl(
          invitation.id
        ),
      }),
      transaction
    )
  }
}
