import {
  WEBHOOK_DELIVERY_STATUSES,
  WEBHOOK_EVENT_TYPES,
  webhookUrlSchema,
} from "@workspace/shared"
import { z } from "zod"
import {
  paginationDtoSchema,
  paginationQuerySchema,
} from "../../common/http/pagination/pagination.schemas"
import {
  apiEmptyDataSchema,
  createApiSuccessResponseSchema,
} from "../../common/http/response/response.schemas"
import {
  libraryParamSchema,
  videoStatusDetailsDtoSchema,
} from "../../libraries/dto/libraries.schemas"

export const webhookDeliveryParamSchema = libraryParamSchema.extend({
  deliveryId: z.uuid(),
})

export const libraryWebhookSaveBodySchema = z
  .object({ url: webhookUrlSchema })
  .meta({ id: "LibraryWebhookSaveBody" })

const webhookEventTypeSchema = z
  .enum(WEBHOOK_EVENT_TYPES)
  .meta({ id: "WebhookEventType" })

const webhookDeliveryStatusSchema = z
  .enum(WEBHOOK_DELIVERY_STATUSES)
  .meta({ id: "WebhookDeliveryStatus" })

export const webhookDeliveryListQuerySchema = paginationQuerySchema
  .pick({ page: true, pageSize: true })
  .extend({ status: webhookDeliveryStatusSchema.optional() })

export const webhookTestEventDataDtoSchema = z
  .object({ libraryId: z.uuid() })
  .meta({ id: "WebhookTestEventData" })

/** The JSON body sent to the webhook; `id` is also sent as `webhook-id`. */
export const webhookEventDtoSchema = z
  .object({
    id: z.uuid(),
    type: webhookEventTypeSchema,
    /** When the event happened; retries keep it. */
    timestamp: z.iso.datetime(),
    /** The video as it is after the change for `video.*`, as it was for `video.deleted`; the library for `webhook.test`. */
    data: z.union([videoStatusDetailsDtoSchema, webhookTestEventDataDtoSchema]),
  })
  .meta({ id: "WebhookEvent" })

/** The signing secret itself is shown only when it is created or rolled. */
export const libraryWebhookDtoSchema = z
  .object({
    url: z.url(),
    signingSecretHint: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "LibraryWebhook" })

export const webhookDeliveryDtoSchema = z
  .object({
    id: z.uuid(),
    eventType: webhookEventTypeSchema,
    status: webhookDeliveryStatusSchema,
    attempts: z.int().nonnegative(),
    responseStatus: z.int().nullable(),
    lastError: z.string().nullable(),
    lastAttemptAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    payload: webhookEventDtoSchema,
  })
  .meta({ id: "WebhookDelivery" })

export const libraryWebhookSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ webhook: libraryWebhookDtoSchema.nullable() })
  ).meta({ id: "LibraryWebhookSuccessResponse" })

export const libraryWebhookSecretSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      webhook: libraryWebhookDtoSchema,
      /** Set only when the secret was just created or rolled; store it now. */
      signingSecret: z.string().nullable(),
    })
  ).meta({ id: "LibraryWebhookSecretSuccessResponse" })

export const webhookDeliverySuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ delivery: webhookDeliveryDtoSchema })
  ).meta({ id: "WebhookDeliverySuccessResponse" })

export const webhookDeliveryPageSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      deliveries: z.array(webhookDeliveryDtoSchema),
      pagination: paginationDtoSchema,
    })
  ).meta({ id: "WebhookDeliveryPageSuccessResponse" })

export const webhookEmptySuccessResponseSchema = createApiSuccessResponseSchema(
  apiEmptyDataSchema
).meta({ id: "WebhookEmptySuccessResponse" })

export type LibraryWebhookSaveBody = z.infer<
  typeof libraryWebhookSaveBodySchema
>
export type WebhookDeliveryListQuery = z.infer<
  typeof webhookDeliveryListQuerySchema
>
export type WebhookEventDto = z.infer<typeof webhookEventDtoSchema>
export type LibraryWebhookDto = z.infer<typeof libraryWebhookDtoSchema>
export type WebhookDeliveryDto = z.infer<typeof webhookDeliveryDtoSchema>
