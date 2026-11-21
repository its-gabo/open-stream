import type { Logger } from "../../common/logging/logger"
import type { ValueOf } from "../../common/types/common.types"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { SendEmailPayload } from "../../email/types/email.types"
import type { StorageCleanupPayload } from "../../storage/types/storage.types"
import type {
  ImportVideoPayload,
  ProcessVideoPayload,
} from "../../libraries/types/libraries.types"
import type { DeliverWebhookPayload } from "../../webhooks/types/webhooks.types"
import type {
  TranscribeVideoPayload,
  VideoProcessedPayload,
} from "../../captions/types/captions.types"
import type { OUTBOX_MESSAGE_TYPES } from "../constants/outbox.constants"
import type { OutboxRepository } from "../repository/outbox.repository"

export type OutboxMessageType = ValueOf<typeof OUTBOX_MESSAGE_TYPES>

/** Payload of every outbox message type; adding a type here requires a handler for it. */
export type OutboxMessagePayloads = {
  [OUTBOX_MESSAGE_TYPES.SEND_EMAIL]: SendEmailPayload
  [OUTBOX_MESSAGE_TYPES.PROCESS_VIDEO]: ProcessVideoPayload
  [OUTBOX_MESSAGE_TYPES.IMPORT_VIDEO]: ImportVideoPayload
  [OUTBOX_MESSAGE_TYPES.VIDEO_PROCESSED]: VideoProcessedPayload
  [OUTBOX_MESSAGE_TYPES.TRANSCRIBE_VIDEO]: TranscribeVideoPayload
  [OUTBOX_MESSAGE_TYPES.DELIVER_WEBHOOK]: DeliverWebhookPayload
  [OUTBOX_MESSAGE_TYPES.CLEAN_UP_STORAGE]: StorageCleanupPayload
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
  logger: Logger
  outboxRepository: OutboxRepository
  outboxMessageHandlers: OutboxMessageHandlers
}
