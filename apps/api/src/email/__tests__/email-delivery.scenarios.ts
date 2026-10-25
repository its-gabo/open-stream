import { ORGANIZATION_EMAIL_KINDS } from "@workspace/email-templates"

import type { OrganizationNotificationEmailProps } from "@workspace/email-templates"

const ORGANIZATION_EMAIL_BASE = {
  email: "ada@example.test",
  organizationName: "Acme",
}

export const DELETION_SCHEDULED_EMAIL: OrganizationNotificationEmailProps = {
  ...ORGANIZATION_EMAIL_BASE,
  kind: ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED,
  scheduledFor: "2026-10-29T12:00:00.000Z",
  cancelUrl: "https://app.openstream.test/organization-deletion?action=cancel",
  deleteUrl: "https://app.openstream.test/organization-deletion?action=delete",
}

export const ORGANIZATION_EMAILS: OrganizationNotificationEmailProps[] = [
  {
    ...ORGANIZATION_EMAIL_BASE,
    kind: ORGANIZATION_EMAIL_KINDS.INVITATION,
    inviterName: "Ada",
    invitationUrl: "https://app.openstream.test/inbox?invitationId=1",
    expiresInDays: 7,
  },
  {
    ...ORGANIZATION_EMAIL_BASE,
    kind: ORGANIZATION_EMAIL_KINDS.INVITATION_ACCEPTED,
    memberName: "Ada",
  },
  { ...ORGANIZATION_EMAIL_BASE, kind: ORGANIZATION_EMAIL_KINDS.MEMBER_REMOVED },
  {
    ...ORGANIZATION_EMAIL_BASE,
    kind: ORGANIZATION_EMAIL_KINDS.MEMBER_LEFT,
    memberName: "Ada",
  },
  {
    ...ORGANIZATION_EMAIL_BASE,
    kind: ORGANIZATION_EMAIL_KINDS.OWNERSHIP_RECEIVED,
    previousOwnerName: "Ada",
  },
  {
    ...ORGANIZATION_EMAIL_BASE,
    kind: ORGANIZATION_EMAIL_KINDS.OWNERSHIP_HANDED_OVER,
    newOwnerName: "Ada",
  },
  DELETION_SCHEDULED_EMAIL,
  {
    ...ORGANIZATION_EMAIL_BASE,
    kind: ORGANIZATION_EMAIL_KINDS.DELETION_CANCELED,
  },
  { ...ORGANIZATION_EMAIL_BASE, kind: ORGANIZATION_EMAIL_KINDS.DELETED },
]
