import { OUTBOX_MESSAGE_TYPES } from "../constants/outbox.constants"
import type { OutboxMessageType } from "../types/outbox.types"

const OUTBOX_MESSAGE_TYPE_VALUES = new Set<string>(
  Object.values(OUTBOX_MESSAGE_TYPES)
)

export const isOutboxMessageType = (name: string): name is OutboxMessageType =>
  OUTBOX_MESSAGE_TYPE_VALUES.has(name)
