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
  publicVideoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibraryApiKey } from "../../libraries/middleware/library-api-key.middleware"
import type { LibraryApiAccessService } from "../../libraries/services/library-api-access.service"
import type { LibraryApiEnv } from "../../libraries/types/libraries.types"
import { VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/captions-openapi.constants"
import { VIDEO_CAPTION_SUCCESS_RESULTS } from "../dto/captions.responses"
import {
  publicVideoCaptionParamSchema,
  videoCaptionListSuccessResponseSchema,
  videoCaptionSuccessResponseSchema,
  videoCaptionUpdateBodySchema,
  videoCaptionUploadBodySchema,
  videoTranscriptionRequestBodySchema,
  videoTranscriptionSuccessResponseSchema,
} from "../dto/captions.schemas"
import type { VideoCaptionsService } from "../services/video-captions.service"
import type { VideoTranscriptionsService } from "../services/video-transcriptions.service"

/**
 * Caption tracks and transcriptions, managed from the customer's own
 * servers with an API key holding each route's scope; a pipeline of one's
 * own can upload its tracks here.
 */
export function createLibraryApiCaptionsRouter(
  libraryApiAccessService: LibraryApiAccessService,
  videoCaptionsService: VideoCaptionsService,
  videoTranscriptionsService: VideoTranscriptionsService
) {
  const requireScope = (scope: LibraryApiKeyScope) =>
    requireLibraryApiKey(libraryApiAccessService, scope)

  return new Hono<LibraryApiEnv>()
    .get(
      "/:libraryId/videos/:videoId/captions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "listLibraryApiVideoCaptions",
        description: "Needs the `videos:read` scope.",
        summary:
          "List a video's caption tracks by language, with its latest transcriptions",
        responses: {
          200: describeJsonResponse(
            "Caption tracks and transcriptions",
            videoCaptionListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.API_LIST
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.LIST,
            await videoCaptionsService.listVideoCaptions(
              c.get("library"),
              c.req.valid("param").videoId
            )
          ),
          200
        )
    )
    .post(
      "/:libraryId/videos/:videoId/captions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "uploadLibraryApiVideoCaption",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Upload a WebVTT or SRT file as a caption track of a processed video; a track of the same language and kind is replaced",
        responses: {
          201: describeJsonResponse(
            "Caption track saved",
            videoCaptionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.API_UPLOAD
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("form", videoCaptionUploadBodySchema, {
        media: "multipart/form-data",
      }),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.UPLOAD,
            await videoCaptionsService.uploadCaption(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").videoId,
              c.req.valid("form")
            )
          ),
          201
        )
    )
    .put(
      "/:libraryId/videos/:videoId/captions/:captionId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiVideoCaption",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Rename a caption track, or make it the one players turn on by themselves",
        responses: {
          200: describeJsonResponse(
            "Caption track saved",
            videoCaptionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.API_WRITE
          ),
        },
      }),
      validateRequest("param", publicVideoCaptionParamSchema),
      validateRequest("json", videoCaptionUpdateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.UPDATE,
            await videoCaptionsService.updateCaption(
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
      "/:libraryId/videos/:videoId/captions/:captionId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "deleteLibraryApiVideoCaption",
        description: "Needs the `videos:manage` scope.",
        summary: "Delete a caption track and its file",
        responses: {
          200: describeJsonResponse(
            "Caption track deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.API_WRITE
          ),
        },
      }),
      validateRequest("param", publicVideoCaptionParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        await videoCaptionsService.deleteCaption(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param")
        )

        return c.json(
          createApiSuccessResponse(VIDEO_CAPTION_SUCCESS_RESULTS.DELETE, {}),
          200
        )
      }
    )
    .post(
      "/:libraryId/videos/:videoId/transcriptions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "requestLibraryApiVideoTranscription",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Transcribe a processed video into a caption track with the library's provider; `video.caption.ready` or `video.transcription.failed` tells the outcome",
        responses: {
          202: describeJsonResponse(
            "Transcription queued",
            videoTranscriptionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.API_TRANSCRIBE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", videoTranscriptionRequestBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.TRANSCRIPTION_REQUEST,
            await videoTranscriptionsService.requestTranscription(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").videoId,
              c.req.valid("json")
            )
          ),
          202
        )
    )
}
