import { LIBRARY_API_KEY_SCOPES } from "@workspace/shared"
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
  publicLibraryParamSchema,
  publicVideoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibraryApiKey } from "../../libraries/middleware/library-api-key.middleware"
import type { LibraryApiAccessService } from "../../libraries/services/library-api-access.service"
import type { LibraryApiEnv } from "../../libraries/types/libraries.types"
import { ANALYTICS_ROUTE_ERROR_DESCRIPTIONS } from "../constants/analytics-openapi.constants"
import { ANALYTICS_SUCCESS_RESULTS } from "../dto/analytics.responses"
import {
  analyticsQuerySchema,
  libraryAnalyticsSuccessResponseSchema,
  videoAnalyticsSuccessResponseSchema,
} from "../dto/analytics.schemas"
import type { VideoAnalyticsService } from "../services/video-analytics.service"

/** The library's analytics through the library API, for keys with `analytics:read`. */
export function createLibraryApiAnalyticsRouter(
  libraryApiAccessService: LibraryApiAccessService,
  videoAnalyticsService: VideoAnalyticsService
) {
  const requireAnalyticsKey = requireLibraryApiKey(
    libraryApiAccessService,
    LIBRARY_API_KEY_SCOPES.ANALYTICS_READ
  )

  return new Hono<LibraryApiEnv>()
    .get(
      "/:libraryId/analytics",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "getLibraryApiAnalytics",
        description: "Needs the `analytics:read` scope.",
        summary: "Read the library's views and watch time over the last `days`",
        responses: {
          200: describeJsonResponse(
            "Library analytics",
            libraryAnalyticsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.API_LIBRARY
          ),
        },
      }),
      validateRequest("param", publicLibraryParamSchema),
      validateRequest("query", analyticsQuerySchema),
      requireAnalyticsKey,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            ANALYTICS_SUCCESS_RESULTS.LIBRARY_GET,
            await videoAnalyticsService.getLibraryAnalytics(
              c.get("library"),
              c.req.valid("query").days
            )
          ),
          200
        )
    )
    .get(
      "/:libraryId/videos/:videoId/analytics",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "getLibraryApiVideoAnalytics",
        description: "Needs the `analytics:read` scope.",
        summary:
          "Read a video's views, watch time and retention over the last `days`",
        responses: {
          200: describeJsonResponse(
            "Video analytics",
            videoAnalyticsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("query", analyticsQuerySchema),
      requireAnalyticsKey,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            ANALYTICS_SUCCESS_RESULTS.VIDEO_GET,
            await videoAnalyticsService.getVideoAnalytics(
              c.get("library"),
              c.req.valid("param").videoId,
              c.req.valid("query").days
            )
          ),
          200
        )
    )
}
