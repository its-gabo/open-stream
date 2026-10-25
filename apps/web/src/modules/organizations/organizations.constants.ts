export const ORGANIZATION_SLUG_SUGGESTION_DEBOUNCE_MS = 300

export const ORGANIZATION_DELETION_ACTIONS = {
  CANCEL: "cancel",
  DELETE: "delete",
} as const

export const ORGANIZATION_INBOX_TABS = {
  GENERAL: "general",
  INVITATIONS: "invitations",
} as const

export const ORGANIZATION_DELETION_ACTION_STATES = {
  PENDING: "pending",
  SUCCESS: "success",
  ERROR: "error",
} as const
