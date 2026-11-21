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
  libraryEmptySuccessResponseSchema,
  playbackQuerySchema,
  publicVideoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { toPlaybackRequest } from "../../libraries/utils/video-playback-http.utils"
import { VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS } from "../constants/ctas-openapi.constants"
import { VIDEO_CTA_SUCCESS_RESULTS } from "../dto/ctas.responses"
import {
  videoCtaEventBodySchema,
  videoCtaLeadBodySchema,
  videoEmbedCtaListSuccessResponseSchema,
  videoViewCtaParamSchema,
} from "../dto/ctas.schemas"
import type { VideoCtaPlaybackService } from "../services/video-cta-playback.service"

/**
 * Where players read calls to action and report what viewers do with them,
 * without an API key. Mount below the library API, whose CORS headers allow
 * any origin.
 */
export function createVideoCtaPlaybackRouter(
  videoCtaPlaybackService: VideoCtaPlaybackService
) {
  return new Hono()
    .get(
      "/:libraryId/videos/:videoId/embed/ctas",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "getLibraryApiVideoEmbedCtas",
        summary:
          "Read the calls to action the player shows; signed libraries need `key`, `expires` and `token`",
        responses: {
          200: describeJsonResponse(
            "Calls to action",
            videoEmbedCtaListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.EMBED_LIST
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("query", playbackQuerySchema),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.EMBED_LIST,
            await videoCtaPlaybackService.listEmbedCtas(
              toPlaybackRequest(c.req, c.req.valid("param"))
            )
          ),
          200
        )
    )
    .post(
      "/:libraryId/videos/:videoId/views/:viewId/ctas/:ctaId/events",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "reportVideoCtaEvent",
        summary:
          "Report that the view showed, clicked or dismissed a call to action; each counts once per view",
        responses: {
          200: describeJsonResponse(
            "Event recorded",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.EVENT
          ),
        },
      }),
      validateRequest("param", videoViewCtaParamSchema),
      validateRequest("json", videoCtaEventBodySchema),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.EVENT_REPORT,
            await videoCtaPlaybackService.reportCtaEvent(
              c.req.valid("param"),
              c.req.valid("json")
            )
          ),
          200
        )
    )
    .post(
      "/:libraryId/videos/:videoId/views/:viewId/ctas/:ctaId/leads",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "submitVideoCtaLead",
        summary:
          "Leave an email address in an email form, with the consent checkbox ticked; once per view",
        responses: {
          201: describeJsonResponse(
            "Email address received",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.LEAD_SUBMIT
          ),
        },
      }),
      validateRequest("param", videoViewCtaParamSchema),
      validateRequest("json", videoCtaLeadBodySchema),
      // Not rate-limited yet: a lead needs a view only a player knows, and rate limiting comes in its own change.
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.LEAD_SUBMIT,
            await videoCtaPlaybackService.submitLead(
              c.req.valid("param"),
              c.req.valid("json")
            )
          ),
          201
        )
    )
}
