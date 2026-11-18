import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
  describeBinaryResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { LIBRARY_ROUTE_ERROR_DESCRIPTIONS } from "../constants/libraries-openapi.constants"
import { VIDEO_DERIVED_FILES } from "../constants/video-processing.constants"
import { LIBRARY_SUCCESS_RESULTS } from "../dto/libraries.responses"
import {
  libraryEmptySuccessResponseSchema,
  libraryParamSchema,
  videoCreateBodySchema,
  videoListSuccessResponseSchema,
  videoParamSchema,
  videoPosterImageBodySchema,
  videoPosterUpdateBodySchema,
  videoSuccessResponseSchema,
  videoUpdateBodySchema,
  memberVideoHlsFileParamSchema,
  memberVideoThumbnailParamSchema,
} from "../dto/libraries.schemas"
import { requireLibrary } from "../middleware/library-access.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { VideoPlaybackService } from "../services/video-playback.service"
import type { VideoPostersService } from "../services/video-posters.service"
import type { VideoProcessingService } from "../services/video-processing.service"
import type { VideosService } from "../services/videos.service"
import type { LibraryEnv } from "../types/libraries.types"
import { toFileResponse } from "../utils/video-playback-http.utils"

/** Videos of a library; every member of the active organization manages them. */
export function createVideosRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  videosService: VideosService,
  videoProcessingService: VideoProcessingService,
  videoPlaybackService: VideoPlaybackService,
  videoPostersService: VideoPostersService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/videos",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listVideos",
        summary: "List the library's videos, newest first",
        responses: {
          200: describeJsonResponse("Videos", videoListSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_LIST
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireMemberOfLibrary,
      async (c) => {
        const videos = await videosService.listVideos(c.get("library"))

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.VIDEO_LIST, videos),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/libraries/:libraryId/videos",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "createVideo",
        summary:
          "Create a draft video, titled explicitly or after the file it will receive",
        responses: {
          201: describeJsonResponse(
            "Video created",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_CREATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", videoCreateBodySchema),
      ...requireMemberOfLibrary,
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
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getVideo",
        summary: "Read a video and its upload state",
        responses: {
          200: describeJsonResponse("Video", videoSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_GET
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      ...requireMemberOfLibrary,
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
    .patch(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateVideo",
        summary: "Rename a video",
        responses: {
          200: describeJsonResponse(
            "Video updated",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_UPDATE
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("json", videoUpdateBodySchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deleteVideo",
        summary: "Delete a video and its stored file",
        responses: {
          200: describeJsonResponse(
            "Video deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_DELETE
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/reprocess",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "reprocessVideo",
        summary:
          "Transcode a processed or failed video again, with the library's current qualities",
        responses: {
          202: describeJsonResponse(
            "Video queued for processing",
            videoSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_REPROCESS
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/poster",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateVideoPoster",
        summary:
          "Take a processed video's poster from a chosen frame, or back from the automatic one",
        responses: {
          200: describeJsonResponse("Poster saved", videoSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_POSTER_UPDATE
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("json", videoPosterUpdateBodySchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/poster/image",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "uploadVideoPosterImage",
        summary:
          "Make an uploaded JPEG, PNG or WebP image the poster of a processed video",
        responses: {
          200: describeJsonResponse("Poster saved", videoSuccessResponseSchema),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_POSTER_UPDATE
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("form", videoPosterImageBodySchema, {
        media: "multipart/form-data",
      }),
      ...requireMemberOfLibrary,
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
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/poster.jpg",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getVideoPoster",
        summary: "Read a processed video's poster, for previews in the web app",
        responses: {
          200: describeBinaryResponse("The poster", "image/jpeg"),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.VIDEO_POSTER
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      ...requireMemberOfLibrary,
      async (c) =>
        toFileResponse(
          await videoPlaybackService.readThumbnailForMember(
            c.get("library"),
            c.req.valid("param").videoId,
            VIDEO_DERIVED_FILES.POSTER
          )
        )
    )
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/hls/:path{.+}",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getVideoHlsFile",
        summary:
          "Read a playlist or segment of a processed video, for the web app's player; members play regardless of the library's playback rules",
        responses: {
          200: describeBinaryResponse(
            "The playlist or segment",
            "application/vnd.apple.mpegurl"
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.MEMBER_PLAYBACK_FILE
          ),
        },
      }),
      validateRequest("param", memberVideoHlsFileParamSchema),
      ...requireMemberOfLibrary,
      async (c) => {
        const { videoId, path } = c.req.valid("param")

        return toFileResponse(
          await videoPlaybackService.readHlsFileForMember(
            c.get("library"),
            videoId,
            path
          )
        )
      }
    )
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/thumbnails/:fileName",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getVideoThumbnail",
        summary:
          "Read a processed video's poster, storyboard image or storyboard WebVTT, for the web app's player",
        responses: {
          200: describeBinaryResponse("The file", "image/jpeg"),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.MEMBER_PLAYBACK_FILE
          ),
        },
      }),
      validateRequest("param", memberVideoThumbnailParamSchema),
      ...requireMemberOfLibrary,
      async (c) => {
        const { videoId, fileName } = c.req.valid("param")

        return toFileResponse(
          await videoPlaybackService.readThumbnailForMember(
            c.get("library"),
            videoId,
            fileName
          )
        )
      }
    )
}
