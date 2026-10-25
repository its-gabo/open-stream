export const ORGANIZATION_ROLES = {
  OWNER: "owner",
  MEMBER: "member",
} as const

export const ORGANIZATION_STATUSES = {
  ACTIVE: "active",
  PENDING_DELETION: "pending_deletion",
} as const

export const ORGANIZATION_INVITATION_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  CANCELED: "canceled",
  EXPIRED: "expired",
} as const

export const ORGANIZATION_FIELD_LIMITS = {
  NAME_MAX_LENGTH: 120,
  SLUG_MIN_LENGTH: 2,
  SLUG_MAX_LENGTH: 63,
} as const

/** How many organizations one user can belong to, owned or joined. */
export const ORGANIZATION_MEMBERSHIP_LIMIT = 5

/** Typed by the owner to confirm scheduling the deletion of an organization. */
export const ORGANIZATION_DELETE_CONFIRMATION_PHRASE = "delete my organization"

/** Lowercase letters and digits, single hyphens between them. */
export const ORGANIZATION_SLUG_PATTERN =
  /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,61}[a-z0-9]$/

/** Top-level web app paths and API path segments an organization slug would shadow. */
export const RESERVED_ORGANIZATION_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "context",
  "forgot-password",
  "inbox",
  "invitations",
  "organization-deletion",
  "organizations",
  "reset-password",
  "settings",
  "sign-in",
  "sign-up",
  "slug-suggestion",
  "verify-email",
])
