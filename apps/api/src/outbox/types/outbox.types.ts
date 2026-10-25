import type { ValueOf } from "../../common/types/common.types"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { SendEmailPayload } from "../../email/types/email.types"
import type { OUTBOX_MESSAGE_TYPES } from "../constants/outbox.constants"
import type { OutboxRepository } from "../repository/outbox.repository"

export type OutboxMessageType = ValueOf<typeof OUTBOX_MESSAGE_TYPES>

/** Payload of every outbox message type; adding a type here requires a handler for it. */
export type OutboxMessagePayloads = {
  [OUTBOX_MESSAGE_TYPES.SEND_EMAIL]: SendEmailPayload
}

export type OutboxMessagePayload = ValueOf<OutboxMessagePayloads>

export type OutboxMessageHandlers = {
  [TType in OutboxMessageType]: (
    payload: OutboxMessagePayloads[TType]
  ) => Promise<void>
}

export type OutboxModuleDependencies = {
  db: Database
}

export type OutboxWorkerModuleDependencies = {
  config: AppConfig
  outboxRepository: OutboxRepository
  outboxMessageHandlers: OutboxMessageHandlers
}
