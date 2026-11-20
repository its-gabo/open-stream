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
import { paginationQuerySchema } from "../../common/http/pagination/pagination.schemas"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  LIBRARY_ROUTE_ERROR_DESCRIPTIONS,
  API_KEY_SECURITY,
} from "../constants/libraries-openapi.constants"
import { LIBRARY_SUCCESS_RESULTS } from "../dto/libraries.responses"
import {
  libraryEmptySuccessResponseSchema,
  playbackUrlCreateBodySchema,
  playbackUrlSuccessResponseSchema,
  publicLibraryParamSchema,
  publicVideoParamSchema,
  videoChaptersUpdateBodySchema,
  videoCreateBodySchema,
  videoImportBodySchema,
  videoPageSuccessResponseSchema,
  videoPosterImageBodySchema,
  videoPosterUpdateBodySchema,
  videoStatusSuccessResponseSchema,
  videoSuccessResponseSchema,
  videoUpdateBodySchema,
} from "../dto/libraries.schemas"
import { requireLibraryApiKey } from "../middleware/library-api-key.middleware"
import type { LibraryApiAccessService } from "../services/library-api-access.service"
import type { VideoImportsService } from "../services/video-imports.service"
import type { VideoPlaybackService } from "../services/video-playback.service"
import type { VideoPostersService } from "../services/video-posters.service"
import type { VideoProcessingService } from "../services/video-processing.service"
import type { VideosService } from "../services/videos.service"
import type { LibraryApiEnv } from "../types/libraries.types"

/** The library's videos, managed from the customer's own servers with an API key holding each route's scope. */
export function createLibraryApiVideosRouter(
  libraryApiAccessService: LibraryApiAccessService,
  videosService: VideosService,
  videoPlaybackService: VideoPlaybackService,
  videoProcessingService: VideoProcessingService,
  videoPostersService: VideoPostersService,
  videoImportsService: VideoImportsService
) {
  const requireScope = (scope: LibraryApiKeyScope) =>
    requireLibraryApiKey(libraryApiAccessService, scope)

  return new Hono<LibraryApiEnv>()
    .get(
      "/:libraryId/videos",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "listLibraryApiVideos",
        description: "Needs the `videos:read` scope.",
        summary: "List and search the library's videos, newest first",
        responses: {
          200: describeJsonResponse("Videos", videoPageSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_LIST
          ),
        },
      }),
      validateRequest("param", publicLibraryParamSchema),
      validateRequest("query", paginationQuerySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) => {
        const videos = await videosService.listVideoPage(
          c.get("library"),
          c.req.valid("query")
        )

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.VIDEO_LIST, videos),
          200
        )
      }
    )
    .post(
      "/:libraryId/videos",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "createLibraryApiVideo",
        description: "Needs the `videos:upload` scope.",
        summary:
          "Create a draft video; upload its file to `/videos/{videoId}/uploads` with tus, or import it with `/videos/{videoId}/import`",
        responses: {
          201: describeJsonResponse(
            "Video created",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_LIST
          ),
        },
      }),
      validateRequest("param", publicLibraryParamSchema),
      validateRequest("json", videoCreateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD),
      async (c) => {
        const created = await videosService.createVideo(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_CREATE,
            created
          ),
          201
        )
      }
    )
    .post(
      "/:libraryId/videos/:videoId/import",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "importLibraryApiVideo",
        description:
          "Needs the `videos:upload` scope. The URL must link straight to an MP4 or MOV file on a public HTTP or HTTPS address; redirects are followed. The worker downloads it, so follow its progress with the status endpoint or the `video.uploaded` and `video.upload_failed` webhook events.",
        summary:
          "Import a draft video's file from a URL instead of uploading it",
        responses: {
          202: describeJsonResponse(
            "Video import started",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_IMPORT
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", videoImportBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD),
      async (c) => {
        const started = await videoImportsService.startImport(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId,
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_IMPORT,
            started
          ),
          202
        )
      }
    )
    .get(
      "/:libraryId/videos/:videoId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "getLibraryApiVideo",
        description: "Needs the `videos:read` scope.",
        summary: "Read a video and its upload state",
        responses: {
          200: describeJsonResponse("Video", videoSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_READ
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) => {
        const video = await videosService.getVideo(
          c.get("library"),
          c.req.valid("param").videoId
        )

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.VIDEO_GET, video),
          200
        )
      }
    )
    .get(
      "/:libraryId/videos/:videoId/status",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "getLibraryApiVideoStatus",
        description:
          "Needs the `videos:read` scope. The same shape as the `data` of `video.processing.*` webhook events, for polling instead of, or alongside, a webhook.",
        summary: "Read where a video is in uploading and processing",
        responses: {
          200: describeJsonResponse(
            "Video status",
            videoStatusSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_READ
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) => {
        const status = await videosService.getVideoStatus(
          c.get("library"),
          c.req.valid("param").videoId
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_STATUS_GET,
            status
          ),
          200
        )
      }
    )
    .patch(
      "/:libraryId/videos/:videoId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiVideo",
        description: "Needs the `videos:manage` scope.",
        summary: "Rename a video",
        responses: {
          200: describeJsonResponse(
            "Video updated",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_WRITE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", videoUpdateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        const updated = await videosService.renameVideo(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId,
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_UPDATE,
            updated
          ),
          200
        )
      }
    )
    .delete(
      "/:libraryId/videos/:videoId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "deleteLibraryApiVideo",
        description: "Needs the `videos:manage` scope.",
        summary: "Delete a video and its stored file",
        responses: {
          200: describeJsonResponse(
            "Video deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_DELETE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        await videosService.deleteVideo(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId
        )

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.VIDEO_DELETE, {}),
          200
        )
      }
    )
    .post(
      "/:libraryId/videos/:videoId/playback-urls",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "createLibraryApiPlaybackUrl",
        description: "Needs the `playback:sign` scope.",
        summary:
          "Sign a stream URL that expires; required when the library only allows signed playback",
        responses: {
          201: describeJsonResponse(
            "Playback URL created",
            playbackUrlSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_WRITE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", playbackUrlCreateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.PLAYBACK_SIGN),
      async (c) => {
        const playback = await videoPlaybackService.createPlaybackUrl(
          c.get("library"),
          c.get("apiKey"),
          c.req.valid("param").videoId,
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.PLAYBACK_URL_CREATE,
            playback
          ),
          201
        )
      }
    )
    .post(
      "/:libraryId/videos/:videoId/reprocess",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "reprocessLibraryApiVideo",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Transcode a processed or failed video again, with the library's current qualities",
        responses: {
          202: describeJsonResponse(
            "Video queued for processing",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_REPROCESS
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        const queued = await videoProcessingService.reprocessVideo(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_REPROCESS,
            queued
          ),
          202
        )
      }
    )
    .put(
      "/:libraryId/videos/:videoId/poster",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiVideoPoster",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Take a processed video's poster from a chosen frame, or back from the automatic one",
        responses: {
          200: describeJsonResponse("Poster saved", videoSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_POSTER_UPDATE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", videoPosterUpdateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        const updated = await videoPostersService.updateVideoPoster(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId,
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_POSTER_UPDATE,
            updated
          ),
          200
        )
      }
    )
    .put(
      "/:libraryId/videos/:videoId/poster/image",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "uploadLibraryApiVideoPosterImage",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Make an uploaded JPEG, PNG or WebP image the poster of a processed video",
        responses: {
          200: describeJsonResponse("Poster saved", videoSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_POSTER_UPDATE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("form", videoPosterImageBodySchema, {
        media: "multipart/form-data",
      }),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        const updated = await videoPostersService.uploadPosterImage(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId,
          c.req.valid("form").image
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_POSTER_UPDATE,
            updated
          ),
          200
        )
      }
    )
    .put(
      "/:libraryId/videos/:videoId/chapters",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiVideoChapters",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Replace a processed video's chapters; the first starts at 0:00 and an empty list removes them",
        responses: {
          200: describeJsonResponse(
            "Chapters saved",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_VIDEO_CHAPTERS_UPDATE
          ),
        },
      }),
      validateRequest("param", publicVideoParamSchema),
      validateRequest("json", videoChaptersUpdateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        const updated = await videosService.updateVideoChapters(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").videoId,
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.VIDEO_CHAPTERS_UPDATE,
            updated
          ),
          200
        )
      }
    )
}
