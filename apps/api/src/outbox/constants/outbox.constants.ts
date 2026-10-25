export const OUTBOX_MESSAGE_TYPES = {
  SEND_EMAIL: "email.send",
} as const

export const OUTBOX_QUEUE_NAME = "outbox"

/** How long BullMQ keeps finished jobs; completed ones also deduplicate re-relayed messages. */
export const OUTBOX_JOB_RETENTION_SECONDS = {
  COMPLETED: 24 * 60 * 60,
  FAILED: 7 * 24 * 60 * 60,
} as const
