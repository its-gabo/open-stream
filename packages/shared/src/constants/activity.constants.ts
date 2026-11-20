/**
 * Who did something: a signed-in member, a server using a library API key,
 * someone not signed in (e.g. a failed sign-in), or OpenStream itself (e.g.
 * deleting an organization once its grace period ends).
 */
export const ACTIVITY_ACTOR_KINDS = {
  USER: "user",
  API_KEY: "api_key",
  ANONYMOUS: "anonymous",
  SYSTEM: "system",
} as const

/** What an activity changed. */
export const ACTIVITY_RESOURCE_TYPES = {
  ACCOUNT: "account",
  ORGANIZATION: "organization",
  INVITATION: "invitation",
  MEMBERSHIP: "membership",
  STORAGE: "storage",
  LIBRARY: "library",
  API_KEY: "api_key",
  WEBHOOK: "webhook",
  VIDEO: "video",
  PLAYLIST: "playlist",
} as const

/** Everything recorded in an organization's activity log, as `<resource>.<what happened>`. */
export const ACTIVITY_ACTIONS = {
  ACCOUNT_SIGNED_UP: "account.signed_up",
  ACCOUNT_EMAIL_VERIFIED: "account.email_verified",
  ACCOUNT_SIGNED_IN: "account.signed_in",
  ACCOUNT_SIGN_IN_FAILED: "account.sign_in_failed",
  ACCOUNT_SIGNED_OUT: "account.signed_out",
  ACCOUNT_PASSWORD_RESET_REQUESTED: "account.password_reset_requested",
  ACCOUNT_PASSWORD_RESET: "account.password_reset",
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
  ORGANIZATION_DELETION_SCHEDULED: "organization.deletion_scheduled",
  ORGANIZATION_DELETION_CANCELED: "organization.deletion_canceled",
  ORGANIZATION_DELETED: "organization.deleted",
  ORGANIZATION_OWNERSHIP_TRANSFERRED: "organization.ownership_transferred",
  INVITATION_CREATED: "invitation.created",
  INVITATION_RESENT: "invitation.resent",
  INVITATION_CANCELED: "invitation.canceled",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_DECLINED: "invitation.declined",
  MEMBERSHIP_REMOVED: "membership.removed",
  MEMBERSHIP_LEFT: "membership.left",
  STORAGE_CREATED: "storage.created",
  STORAGE_UPDATED: "storage.updated",
  STORAGE_DELETED: "storage.deleted",
  LIBRARY_CREATED: "library.created",
  LIBRARY_UPDATED: "library.updated",
  LIBRARY_STORAGE_CHANGED: "library.storage_changed",
  LIBRARY_ENCODING_UPDATED: "library.encoding_updated",
  LIBRARY_SECURITY_UPDATED: "library.security_updated",
  LIBRARY_PLAYER_UPDATED: "library.player_updated",
  API_KEY_CREATED: "api_key.created",
  API_KEY_UPDATED: "api_key.updated",
  API_KEY_ROLLED: "api_key.rolled",
  API_KEY_DELETED: "api_key.deleted",
  WEBHOOK_CREATED: "webhook.created",
  WEBHOOK_UPDATED: "webhook.updated",
  WEBHOOK_DELETED: "webhook.deleted",
  WEBHOOK_SECRET_ROLLED: "webhook.secret_rolled",
  WEBHOOK_TEST_SENT: "webhook.test_sent",
  WEBHOOK_DELIVERY_RESENT: "webhook.delivery_resent",
  VIDEO_CREATED: "video.created",
  VIDEO_UPDATED: "video.updated",
  VIDEO_POSTER_UPDATED: "video.poster_updated",
  VIDEO_CHAPTERS_UPDATED: "video.chapters_updated",
  VIDEO_DELETED: "video.deleted",
  VIDEO_UPLOADED: "video.uploaded",
  VIDEO_UPLOAD_CANCELED: "video.upload_canceled",
  VIDEO_IMPORT_STARTED: "video.import_started",
  VIDEO_REPROCESS_REQUESTED: "video.reprocess_requested",
  PLAYLIST_CREATED: "playlist.created",
  PLAYLIST_UPDATED: "playlist.updated",
  PLAYLIST_VIDEOS_UPDATED: "playlist.videos_updated",
  PLAYLIST_DELETED: "playlist.deleted",
} as const

export const ACTIVITY_LIMITS = {
  /** Longest user agent kept with an activity. */
  USER_AGENT_MAX_LENGTH: 512,
} as const

/** Why a sign-in failed, as recorded in the account's activity. */
export const SIGN_IN_FAILURE_REASONS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  EMAIL_NOT_VERIFIED: "email_not_verified",
} as const
