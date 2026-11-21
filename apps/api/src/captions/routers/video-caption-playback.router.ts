import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeBinaryResponse,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  playbackQuerySchema,
  publicVideoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import {
  toFileResponse,
  toPlaybackRequest,
} from "../../libraries/utils/video-playback-http.utils"
import { VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/captions-openapi.constants"
import { VIDEO_CAPTION_SUCCESS_RESULTS } from "../dto/captions.responses"
import {
  publicVideoCaptionFileParamSchema,
  videoEmbedCaptionListSuccessResponseSchema,
} from "../dto/captions.schemas"
import type { VideoCaptionPlaybackService } from "../services/video-caption-playback.service"

/**
 * Where players read a video's caption tracks, without an API key. Mount
 * below the library API, whose CORS headers allow any origin.
 */
export function createVideoCaptionPlaybackRouter(
  videoCaptionPlaybackService: VideoCaptionPlaybackService
) {
  return new Hono()
    .get(
      "/:libraryId/videos/:videoId/embed/captions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "getLibraryApiVideoEmbedCaptions",
        summary:
          "Read a processed video's caption tracks with the URL of each WebVTT; signed libraries need `key`, `expires` and `token`",
        responses: {
          200: describeJsonResponse(
            "Caption tracks",
            videoEmbedCaptionListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.EMBED_LIST
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("query", playbackQuerySchema),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.EMBED_LIST,
            await videoCaptionPlaybackService.listEmbedCaptions(
              toPlaybackRequest(c.req, c.req.valid("param"))
            )
          ),
          200
        )
    )
    .get(
      "/:libraryId/videos/:videoId/captions/:fileName",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "readLibraryApiVideoCaptionFile",
        summary:
          "Read a caption track's WebVTT, `<captionId>.vtt`; signed libraries need `key`, `expires` and `token`",
        responses: {
          200: describeBinaryResponse("The WebVTT", "text/vtt"),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.EMBED_FILE
          ),
        },
      }),
      validateRequest("param", publicVideoCaptionFileParamSchema),
      validateRequest("query", playbackQuerySchema),
      async (c) => {
        const { fileName, ...video } = c.req.valid("param")

        return toFileResponse(
          await videoCaptionPlaybackService.readCaptionFile(
            toPlaybackRequest(c.req, video),
            fileName
          )
        )
      }
    )
}
