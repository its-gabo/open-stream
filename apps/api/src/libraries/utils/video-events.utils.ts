import type { WebhookEventType } from "@workspace/shared"
import type { VideoRecord } from "../../db/schema"
import type { WebhookEvent } from "../../webhooks/types/webhooks.types"
import { toVideoStatusDetailsDto } from "../dto/libraries.dto.mappers"

/** A webhook event carrying the video's status as it is after the change. */
export const toVideoWebhookEvent = (
  type: WebhookEventType,
  video: VideoRecord
): WebhookEvent => ({ type, data: toVideoStatusDetailsDto(video) })
