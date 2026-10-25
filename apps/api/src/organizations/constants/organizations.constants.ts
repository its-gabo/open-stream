export const ORGANIZATION_INVITATION_TTL_DAYS = 7

/** Expired invitations stay visible to owners (to resend them) for this long before they are purged. */
export const ORGANIZATION_INVITATION_RETENTION_DAYS = 30

/** Grace period between scheduling a deletion and the organization being permanently deleted. */
export const ORGANIZATION_DELETION_DELAY_DAYS = 4

/** How many due deletions one sweep claims, so a backlog is processed in bounded transactions. */
export const ORGANIZATION_DELETION_SWEEP_BATCH_SIZE = 20

export const ORGANIZATION_DELETION_ACTIONS = {
  CANCEL: "cancel",
  DELETE: "delete",
} as const

export const ORGANIZATION_ACTION_PATHS = {
  INBOX: "/inbox",
  DELETION: "/organization-deletion",
} as const

export const ORGANIZATION_EMAIL_SUBJECTS = {
  INVITATION: "You have been invited to an OpenStream organization",
  INVITATION_ACCEPTED: "Your OpenStream invitation was accepted",
  MEMBER_REMOVED: "Your OpenStream organization access changed",
  MEMBER_LEFT: "A member left your OpenStream organization",
  OWNERSHIP_TRANSFERRED: "OpenStream organization ownership changed",
  DELETION_SCHEDULED: "OpenStream organization deletion scheduled",
  DELETION_CANCELED: "OpenStream organization deletion canceled",
  DELETED: "OpenStream organization permanently deleted",
} as const
