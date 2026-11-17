import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  playbackQuerySchema,
  publicVideoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { toPlaybackRequest } from "../../libraries/utils/video-playback-http.utils"
import { ANALYTICS_ROUTE_ERROR_DESCRIPTIONS } from "../constants/analytics-openapi.constants"
import { ANALYTICS_SUCCESS_RESULTS } from "../dto/analytics.responses"
import {
  videoViewParamSchema,
  videoViewProgressBodySchema,
  videoViewProgressSuccessResponseSchema,
  videoViewStartBodySchema,
  videoViewSuccessResponseSchema,
} from "../dto/analytics.schemas"
import type { VideoViewsService } from "../services/video-views.service"

/**
 * Where players report their viewers, without an API key: a view starts
 * under the same rules as playback. Mount below the library API, whose CORS
 * headers allow any origin.
 */
export function createVideoViewsRouter(videoViewsService: VideoViewsService) {
  return new Hono()
    .post(
      "/:libraryId/videos/:videoId/views",
      describeRoute({
        tags: [OPENAPI_TAGS.ANALYTICS],
        operationId: "startVideoView",
        summary:
          "Start counting a view when the player starts playing; signed libraries need `key`, `expires` and `token`",
        responses: {
          201: describeJsonResponse(
            "View started",
            videoViewSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.VIEW_START
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("query", playbackQuerySchema),
      validateRequest("json", videoViewStartBodySchema),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            ANALYTICS_SUCCESS_RESULTS.VIEW_START,
            await videoViewsService.startView(
              toPlaybackRequest(c.req, c.req.valid("param")),
              c.req.valid("json"),
              c.req.header("user-agent")
            )
          ),
          201
        )
    )
    .post(
      "/:libraryId/videos/:videoId/views/:viewId/progress",
      describeRoute({
        tags: [OPENAPI_TAGS.ANALYTICS],
        operationId: "reportVideoViewProgress",
        summary:
          "Report the seconds watched since the last report and the current position",
        responses: {
          200: describeJsonResponse(
            "Progress recorded",
            videoViewProgressSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.VIEW_PROGRESS
          ),
        },
      }),
      validateRequest("param", videoViewParamSchema),
      validateRequest("json", videoViewProgressBodySchema),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            ANALYTICS_SUCCESS_RESULTS.VIEW_PROGRESS,
            await videoViewsService.reportViewProgress(
              c.req.valid("param"),
              c.req.valid("json")
            )
          ),
          200
        )
    )
}
