import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { libraryParamSchema } from "../../libraries/dto/libraries.schemas"
import { requireLibrary } from "../../libraries/middleware/library-access.middleware"
import type { LibrariesService } from "../../libraries/services/libraries.service"
import type { LibraryEnv } from "../../libraries/types/libraries.types"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { WEBHOOK_ROUTE_ERROR_DESCRIPTIONS } from "../constants/webhooks-openapi.constants"
import { WEBHOOK_SUCCESS_RESULTS } from "../dto/webhooks.responses"
import {
  libraryWebhookSaveBodySchema,
  libraryWebhookSecretSuccessResponseSchema,
  libraryWebhookSuccessResponseSchema,
  webhookDeliveryListQuerySchema,
  webhookDeliveryPageSuccessResponseSchema,
  webhookDeliveryParamSchema,
  webhookDeliverySuccessResponseSchema,
  webhookEmptySuccessResponseSchema,
} from "../dto/webhooks.schemas"
import type { LibraryWebhooksService } from "../services/library-webhooks.service"
import { WEBHOOK_PATH } from "../constants/webhooks.constants"

/** The library's webhook and what was sent to it; owner-only. */
export function createLibraryWebhooksRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  libraryWebhooksService: LibraryWebhooksService
) {
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      WEBHOOK_PATH,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryWebhook",
        summary: "Read the library's webhook; null when it has none",
        responses: {
          200: describeJsonResponse(
            "Library webhook",
            libraryWebhookSuccessResponseSchema
          ),
          ...describeApiErrorResponses(WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.GET),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const webhook = await libraryWebhooksService.getWebhook(
          c.get("library")
        )

        return c.json(
          createApiSuccessResponse(WEBHOOK_SUCCESS_RESULTS.GET, webhook),
          200
        )
      }
    )
    .put(
      WEBHOOK_PATH,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "saveLibraryWebhook",
        summary:
          "Set the URL events are sent to; a new webhook's signing secret is shown only in this response",
        responses: {
          200: describeJsonResponse(
            "Library webhook saved",
            libraryWebhookSecretSuccessResponseSchema
          ),
          ...describeApiErrorResponses(WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.SAVE),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryWebhookSaveBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const saved = await libraryWebhooksService.saveWebhook(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(WEBHOOK_SUCCESS_RESULTS.SAVE, saved),
          200
        )
      }
    )
    .delete(
      WEBHOOK_PATH,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deleteLibraryWebhook",
        summary: "Stop sending events, and forget what was sent",
        responses: {
          200: describeJsonResponse(
            "Library webhook removed",
            webhookEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.CHANGE),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const deleted = await libraryWebhooksService.deleteWebhook(
          c.get("library"),
          c.get("activityActor")
        )

        return c.json(
          createApiSuccessResponse(WEBHOOK_SUCCESS_RESULTS.DELETE, deleted),
          200
        )
      }
    )
    .post(
      `${WEBHOOK_PATH}/roll-secret`,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "rollLibraryWebhookSecret",
        summary:
          "Give the webhook a new signing secret, shown only in this response",
        responses: {
          200: describeJsonResponse(
            "Webhook signing secret rolled",
            libraryWebhookSecretSuccessResponseSchema
          ),
          ...describeApiErrorResponses(WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.CHANGE),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const rolled = await libraryWebhooksService.rollSigningSecret(
          c.get("library"),
          c.get("activityActor")
        )

        return c.json(
          createApiSuccessResponse(WEBHOOK_SUCCESS_RESULTS.SECRET_ROLL, rolled),
          200
        )
      }
    )
    .post(
      `${WEBHOOK_PATH}/test`,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "sendLibraryWebhookTest",
        summary: "Send a `webhook.test` event to check the endpoint",
        responses: {
          202: describeJsonResponse(
            "Test event queued",
            webhookDeliverySuccessResponseSchema
          ),
          ...describeApiErrorResponses(WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.CHANGE),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const queued = await libraryWebhooksService.sendTestEvent(
          c.get("library"),
          c.get("activityActor")
        )

        return c.json(
          createApiSuccessResponse(WEBHOOK_SUCCESS_RESULTS.TEST, queued),
          202
        )
      }
    )
    .get(
      `${WEBHOOK_PATH}/deliveries`,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listLibraryWebhookDeliveries",
        summary: "List events sent to the webhook, newest first",
        responses: {
          200: describeJsonResponse(
            "Webhook deliveries",
            webhookDeliveryPageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.GET),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("query", webhookDeliveryListQuerySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const deliveries = await libraryWebhooksService.listDeliveries(
          c.get("library"),
          c.req.valid("query")
        )

        return c.json(
          createApiSuccessResponse(
            WEBHOOK_SUCCESS_RESULTS.DELIVERY_LIST,
            deliveries
          ),
          200
        )
      }
    )
    .post(
      `${WEBHOOK_PATH}/deliveries/:deliveryId/resend`,
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "resendLibraryWebhookDelivery",
        summary:
          "Send a finished delivery again, unchanged, to the webhook's current URL",
        responses: {
          202: describeJsonResponse(
            "Delivery queued again",
            webhookDeliverySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            WEBHOOK_ROUTE_ERROR_DESCRIPTIONS.DELIVERY_RESEND
          ),
        },
      }),
      validateRequest("param", webhookDeliveryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const resent = await libraryWebhooksService.resendDelivery(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").deliveryId
        )

        return c.json(
          createApiSuccessResponse(
            WEBHOOK_SUCCESS_RESULTS.DELIVERY_RESEND,
            resent
          ),
          202
        )
      }
    )
}
