import {
  LIBRARY_API_KEY_SCOPES,
  type LibraryApiKeyScope,
} from "@workspace/shared"
import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { API_KEY_SECURITY } from "../../libraries/constants/libraries-openapi.constants"
import {
  libraryEmptySuccessResponseSchema,
  publicLibraryParamSchema,
  publicVideoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibraryApiKey } from "../../libraries/middleware/library-api-key.middleware"
import type { LibraryApiAccessService } from "../../libraries/services/library-api-access.service"
import type { LibraryApiEnv } from "../../libraries/types/libraries.types"
import { VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS } from "../constants/ctas-openapi.constants"
import { VIDEO_CTA_SUCCESS_RESULTS } from "../dto/ctas.responses"
import {
  publicVideoCtaParamSchema,
  videoCtaBodySchema,
  videoCtaLeadListQuerySchema,
  videoCtaLeadPageSuccessResponseSchema,
  videoCtaListSuccessResponseSchema,
  videoCtaSuccessResponseSchema,
} from "../dto/ctas.schemas"
import type { VideoCtaLeadsService } from "../services/video-cta-leads.service"
import type { VideoCtasService } from "../services/video-ctas.service"

/** Calls to action and leads, managed from the customer's own servers with an API key holding each route's scope. */
export function createLibraryApiCtasRouter(
  libraryApiAccessService: LibraryApiAccessService,
  videoCtasService: VideoCtasService,
  videoCtaLeadsService: VideoCtaLeadsService
) {
  const requireScope = (scope: LibraryApiKeyScope) =>
    requireLibraryApiKey(libraryApiAccessService, scope)

  return new Hono<LibraryApiEnv>()
    .get(
      "/:libraryId/videos/:videoId/ctas",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "listLibraryApiVideoCtas",
        description: "Needs the `videos:read` scope.",
        summary:
          "List a video's calls to action: overlays by when they appear, then the end screen",
        responses: {
          200: describeJsonResponse(
            "Calls to action",
            videoCtaListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.API_LIST
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.LIST,
            await videoCtasService.listVideoCtas(
              c.get("library"),
              c.req.valid("param").videoId
            )
          ),
          200
        )
    )
    .post(
      "/:libraryId/videos/:videoId/ctas",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "createLibraryApiVideoCta",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Add a call to action to a processed video: a button or an email form, as an overlay or the end screen",
        responses: {
          201: describeJsonResponse(
            "Call to action created",
            videoCtaSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.API_CREATE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", videoCtaBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.CREATE,
            await videoCtasService.createVideoCta(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").videoId,
              c.req.valid("json")
            )
          ),
          201
        )
    )
    .put(
      "/:libraryId/videos/:videoId/ctas/:ctaId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiVideoCta",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Replace a call to action's fields; its view counts and leads stay with it",
        responses: {
          200: describeJsonResponse(
            "Call to action saved",
            videoCtaSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.API_WRITE
          ),
        },
      }),
      validateRequest("param", publicVideoCtaParamSchema),
      validateRequest("json", videoCtaBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.UPDATE,
            await videoCtasService.updateVideoCta(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param"),
              c.req.valid("json")
            )
          ),
          200
        )
    )
    .delete(
      "/:libraryId/videos/:videoId/ctas/:ctaId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "deleteLibraryApiVideoCta",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Delete a call to action and its view counts; leads left in it stay",
        responses: {
          200: describeJsonResponse(
            "Call to action deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.API_WRITE
          ),
        },
      }),
      validateRequest("param", publicVideoCtaParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        await videoCtasService.deleteVideoCta(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param")
        )

        return c.json(
          createApiSuccessResponse(VIDEO_CTA_SUCCESS_RESULTS.DELETE, {}),
          200
        )
      }
    )
    .get(
      "/:libraryId/leads",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "listLibraryApiLeads",
        description: "Needs the `leads:read` scope.",
        summary:
          "List the email addresses viewers left in the library's calls to action, newest first",
        responses: {
          200: describeJsonResponse(
            "Leads",
            videoCtaLeadPageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.API_LEAD_LIST
          ),
        },
      }),
      validateRequest("param", publicLibraryParamSchema),
      validateRequest("query", videoCtaLeadListQuerySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.LEADS_READ),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.LEAD_LIST,
            await videoCtaLeadsService.listLeadPage(
              c.get("library"),
              c.req.valid("query")
            )
          ),
          200
        )
    )
}
