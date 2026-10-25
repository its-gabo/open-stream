import {
  CircleCheckIcon,
  CrownIcon,
  DoorOpenIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "lucide-react"

import { EmailLayout } from "./components/EmailLayout"
import { EMAIL_BRAND_NAME } from "./theme/email-styles"

import type { ComponentProps } from "react"

export const ORGANIZATION_EMAIL_KINDS = {
  INVITATION: "invitation",
  INVITATION_ACCEPTED: "invitation-accepted",
  MEMBER_REMOVED: "member-removed",
  MEMBER_LEFT: "member-left",
  OWNERSHIP_RECEIVED: "ownership-received",
  OWNERSHIP_HANDED_OVER: "ownership-handed-over",
  DELETION_SCHEDULED: "deletion-scheduled",
  DELETION_CANCELED: "deletion-canceled",
  DELETED: "deleted",
} as const

export type OrganizationNotificationEmailProps = {
  email: string
  organizationName: string
} & (
  | {
      kind: typeof ORGANIZATION_EMAIL_KINDS.INVITATION
      inviterName: string
      invitationUrl: string
      expiresInDays: number
    }
  | {
      kind: typeof ORGANIZATION_EMAIL_KINDS.INVITATION_ACCEPTED
      memberName: string
    }
  | { kind: typeof ORGANIZATION_EMAIL_KINDS.MEMBER_REMOVED }
  | { kind: typeof ORGANIZATION_EMAIL_KINDS.MEMBER_LEFT; memberName: string }
  | {
      kind: typeof ORGANIZATION_EMAIL_KINDS.OWNERSHIP_RECEIVED
      previousOwnerName: string
    }
  | {
      kind: typeof ORGANIZATION_EMAIL_KINDS.OWNERSHIP_HANDED_OVER
      newOwnerName: string
    }
  | {
      kind: typeof ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED
      /** ISO 8601 timestamp of the permanent deletion. */
      scheduledFor: string
      cancelUrl: string
      deleteUrl: string
    }
  | { kind: typeof ORGANIZATION_EMAIL_KINDS.DELETION_CANCELED }
  | { kind: typeof ORGANIZATION_EMAIL_KINDS.DELETED }
)

type OrganizationEmailContent = Omit<
  ComponentProps<typeof EmailLayout>,
  "footerNotice"
>

const ICON_PROPS = { size: 24, strokeWidth: 2 } as const

const formatDeletionDate = (isoDate: string) =>
  `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(isoDate))} UTC`

function getContent(
  props: OrganizationNotificationEmailProps
): OrganizationEmailContent {
  const { organizationName } = props

  switch (props.kind) {
    case ORGANIZATION_EMAIL_KINDS.INVITATION:
      return {
        preview: `${props.inviterName} invited you to ${organizationName}.`,
        icon: <UserPlusIcon {...ICON_PROPS} />,
        title: `Join ${organizationName}`,
        intro: `${props.inviterName} invited you to join ${organizationName} on ${EMAIL_BRAND_NAME}. Sign in or create an account with this email address to accept the invitation.`,
        action: { label: "Review Invitation", url: props.invitationUrl },
        notice: `This invitation will expire in ${props.expiresInDays} days. If you weren't expecting it, you can safely ignore this email.`,
      }
    case ORGANIZATION_EMAIL_KINDS.INVITATION_ACCEPTED:
      return {
        preview: `${props.memberName} joined ${organizationName}.`,
        icon: <CircleCheckIcon {...ICON_PROPS} />,
        title: "Invitation Accepted",
        intro: `${props.memberName} accepted your invitation and is now a member of ${organizationName}.`,
      }
    case ORGANIZATION_EMAIL_KINDS.MEMBER_REMOVED:
      return {
        preview: `Your access to ${organizationName} was removed.`,
        icon: <UserMinusIcon {...ICON_PROPS} />,
        title: "Organization Access Removed",
        intro: `The owner of ${organizationName} removed you from the organization. You no longer have access to it.`,
      }
    case ORGANIZATION_EMAIL_KINDS.MEMBER_LEFT:
      return {
        preview: `${props.memberName} left ${organizationName}.`,
        icon: <DoorOpenIcon {...ICON_PROPS} />,
        title: "A Member Left",
        intro: `${props.memberName} left ${organizationName} and no longer has access to it.`,
      }
    case ORGANIZATION_EMAIL_KINDS.OWNERSHIP_RECEIVED:
      return {
        preview: `You are now the owner of ${organizationName}.`,
        icon: <CrownIcon {...ICON_PROPS} />,
        title: "You Are Now the Owner",
        intro: `${props.previousOwnerName} transferred ownership of ${organizationName} to you. You can now manage its settings, team and deletion.`,
      }
    case ORGANIZATION_EMAIL_KINDS.OWNERSHIP_HANDED_OVER:
      return {
        preview: `${props.newOwnerName} now owns ${organizationName}.`,
        icon: <CrownIcon {...ICON_PROPS} />,
        title: "Ownership Transferred",
        intro: `${props.newOwnerName} is now the owner of ${organizationName}. You remain a member of the organization.`,
      }
    case ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED:
      return {
        preview: `${organizationName} is scheduled for deletion.`,
        icon: <TriangleAlertIcon {...ICON_PROPS} />,
        title: "Organization Deletion Scheduled",
        intro: `${organizationName} is disabled now and will be permanently deleted on ${formatDeletionDate(props.scheduledFor)}. You can cancel the deletion or delete it right away.`,
        action: { label: "Cancel Deletion", url: props.cancelUrl },
        secondaryAction: { label: "Delete now", url: props.deleteUrl },
        notice:
          "Both links work only while you are signed in as the owner of the organization, and only until the deletion date.",
      }
    case ORGANIZATION_EMAIL_KINDS.DELETION_CANCELED:
      return {
        preview: `${organizationName} is active again.`,
        icon: <CircleCheckIcon {...ICON_PROPS} />,
        title: "Organization Deletion Canceled",
        intro: `${organizationName} is active again. The links from the deletion email can no longer be used.`,
      }
    case ORGANIZATION_EMAIL_KINDS.DELETED:
      return {
        preview: `${organizationName} was permanently deleted.`,
        icon: <Trash2Icon {...ICON_PROPS} />,
        title: "Organization Deleted",
        intro: `${organizationName} and all of its data have been permanently deleted.`,
      }
  }
}

export default function OrganizationNotificationEmail(
  props: OrganizationNotificationEmailProps
) {
  return (
    <EmailLayout
      {...getContent(props)}
      footerNotice={`This email was sent to ${props.email} because of your membership in ${props.organizationName} on ${EMAIL_BRAND_NAME}.`}
    />
  )
}

OrganizationNotificationEmail.PreviewProps = {
  kind: ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED,
  email: "ada@example.com",
  organizationName: "Analytical Engines",
  scheduledFor: "2026-10-29T12:00:00.000Z",
  cancelUrl:
    "http://localhost:3000/organization-deletion?action=cancel&token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  deleteUrl:
    "http://localhost:3000/organization-deletion?action=delete&token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
} satisfies OrganizationNotificationEmailProps
