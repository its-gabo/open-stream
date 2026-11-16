import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeBinaryResponse,
} from "../../common/http/openapi/openapi.utils"
import { validateRequest } from "../../common/http/validation/validate-request"
import { LIBRARY_ROUTE_ERROR_DESCRIPTIONS } from "../constants/libraries-openapi.constants"
import {
  playbackQuerySchema,
  publicVideoParamSchema,
  videoHlsFileParamSchema,
  videoThumbnailParamSchema,
} from "../dto/libraries.schemas"
import type { VideoPlaybackService } from "../services/video-playback.service"
import {
  toFileResponse,
  toPlaybackRequest,
  toStreamHeaders,
} from "../utils/video-playback-http.utils"

/**
 * Plays videos without an API key: the library's playback rules decide who
 * may watch, so the CORS headers of the library API allow any origin. The
 * uploaded file supports range requests for seeking; processed videos also
 * play as HLS and have a poster and a storyboard.
 */
export function createVideoPlaybackRouter(
  videoPlaybackService: VideoPlaybackService
) {
  return new Hono()
    .get(
      // Serves HEAD too: Hono answers HEAD with the GET handler, without the body.
      "/:libraryId/videos/:videoId/stream",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "streamLibraryApiVideo",
        summary:
          "Stream the uploaded file; supports `Range`, and needs `key`, `expires` and `token` when the library requires signed playback",
        responses: {
          200: describeBinaryResponse("The whole file", "video/*"),
          206: describeBinaryResponse("The requested bytes", "video/*"),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_STREAM
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("query", playbackQuerySchema),
      async (c) => {
        const stream = await videoPlaybackService.openVideoStream({
          ...toPlaybackRequest(c.req, c.req.valid("param")),
          rangeHeader: c.req.header("range"),
          includeBody: c.req.method !== "HEAD",
        })

        return new Response(stream.body, {
          status: stream.range ? 206 : 200,
          headers: toStreamHeaders(stream),
        })
      }
    )
    .get(
      "/:libraryId/videos/:videoId/hls/:path{.+}",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "readLibraryApiVideoHlsFile",
        summary:
          "Play a processed video with HLS: start at `hls/master.m3u8`; its playlists pass the URL's signature on",
        responses: {
          200: describeBinaryResponse(
            "A playlist or segment",
            "application/vnd.apple.mpegurl"
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_PLAYBACK_FILE
          ),
        },
      }),
      validateRequest("param", videoHlsFileParamSchema),
      validateRequest("query", playbackQuerySchema),
      async (c) => {
        const { path, ...video } = c.req.valid("param")

        return toFileResponse(
          await videoPlaybackService.readHlsFile(
            toPlaybackRequest(c.req, video),
            path
          )
        )
      }
    )
    .get(
      "/:libraryId/videos/:videoId/thumbnails/:fileName",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        operationId: "readLibraryApiVideoThumbnail",
        summary:
          "Read `poster.jpg`, or the seek previews `storyboard.vtt` and `storyboard.jpg`, of a processed video",
        responses: {
          200: describeBinaryResponse("The image or WebVTT", "image/jpeg"),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_PLAYBACK_FILE
          ),
        },
      }),
      validateRequest("param", videoThumbnailParamSchema),
      validateRequest("query", playbackQuerySchema),
      async (c) => {
        const { fileName, ...video } = c.req.valid("param")

        return toFileResponse(
          await videoPlaybackService.readThumbnailFile(
            toPlaybackRequest(c.req, video),
            fileName
          )
        )
      }
    )
}
