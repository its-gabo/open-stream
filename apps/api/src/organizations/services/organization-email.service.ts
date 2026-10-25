import {
  ORGANIZATION_EMAIL_KINDS,
  type OrganizationNotificationEmailProps,
} from "@workspace/email-templates"
import { EMAIL_TEMPLATES } from "../../email/constants/email.constants"
import type { SendEmailPayload } from "../../email/types/email.types"
import {
  ORGANIZATION_EMAIL_SUBJECTS,
  ORGANIZATION_INVITATION_TTL_DAYS,
} from "../constants/organizations.constants"
import type { OrganizationPerson } from "../types/organizations.types"

/** Composes the notification emails of organization changes; the worker renders them. */
export class OrganizationEmailService {
  composeInvitationEmail(params: {
    email: string
    organizationName: string
    inviterName: string
    invitationUrl: string
  }) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.INVITATION, {
      kind: ORGANIZATION_EMAIL_KINDS.INVITATION,
      ...params,
      expiresInDays: ORGANIZATION_INVITATION_TTL_DAYS,
    })
  }

  composeInvitationAcceptedEmail(
    owner: OrganizationPerson,
    organizationName: string,
    memberName: string
  ) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.INVITATION_ACCEPTED, {
      kind: ORGANIZATION_EMAIL_KINDS.INVITATION_ACCEPTED,
      email: owner.email,
      organizationName,
      memberName,
    })
  }

  composeMemberRemovedEmail(
    member: OrganizationPerson,
    organizationName: string
  ) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.MEMBER_REMOVED, {
      kind: ORGANIZATION_EMAIL_KINDS.MEMBER_REMOVED,
      email: member.email,
      organizationName,
    })
  }

  composeMemberLeftEmail(
    owner: OrganizationPerson,
    organizationName: string,
    memberName: string
  ) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.MEMBER_LEFT, {
      kind: ORGANIZATION_EMAIL_KINDS.MEMBER_LEFT,
      email: owner.email,
      organizationName,
      memberName,
    })
  }

  composeOwnershipTransferEmails(
    previousOwner: OrganizationPerson,
    newOwner: OrganizationPerson,
    organizationName: string
  ) {
    return [
      this.compose(ORGANIZATION_EMAIL_SUBJECTS.OWNERSHIP_TRANSFERRED, {
        kind: ORGANIZATION_EMAIL_KINDS.OWNERSHIP_HANDED_OVER,
        email: previousOwner.email,
        organizationName,
        newOwnerName: newOwner.name,
      }),
      this.compose(ORGANIZATION_EMAIL_SUBJECTS.OWNERSHIP_TRANSFERRED, {
        kind: ORGANIZATION_EMAIL_KINDS.OWNERSHIP_RECEIVED,
        email: newOwner.email,
        organizationName,
        previousOwnerName: previousOwner.name,
      }),
    ]
  }

  composeDeletionScheduledEmail(params: {
    email: string
    organizationName: string
    scheduledFor: Date
    cancelUrl: string
    deleteUrl: string
  }) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.DELETION_SCHEDULED, {
      kind: ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED,
      ...params,
      scheduledFor: params.scheduledFor.toISOString(),
    })
  }

  composeDeletionCanceledEmail(
    owner: OrganizationPerson,
    organizationName: string
  ) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.DELETION_CANCELED, {
      kind: ORGANIZATION_EMAIL_KINDS.DELETION_CANCELED,
      email: owner.email,
      organizationName,
    })
  }

  composeDeletedEmail(owner: OrganizationPerson, organizationName: string) {
    return this.compose(ORGANIZATION_EMAIL_SUBJECTS.DELETED, {
      kind: ORGANIZATION_EMAIL_KINDS.DELETED,
      email: owner.email,
      organizationName,
    })
  }

  private compose(
    subject: string,
    props: OrganizationNotificationEmailProps
  ): SendEmailPayload {
    return {
      recipient: props.email,
      subject,
      template: EMAIL_TEMPLATES.ORGANIZATION_NOTIFICATION,
      props,
    }
  }
}
