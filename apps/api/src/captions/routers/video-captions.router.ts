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
  libraryEmptySuccessResponseSchema,
  libraryParamSchema,
  videoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibrary } from "../../libraries/middleware/library-access.middleware"
import type { LibrariesService } from "../../libraries/services/libraries.service"
import type { LibraryEnv } from "../../libraries/types/libraries.types"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/captions-openapi.constants"
import { CAPTION_FILE_CONTENT_TYPE } from "../constants/captions.constants"
import { VIDEO_CAPTION_SUCCESS_RESULTS } from "../dto/captions.responses"
import {
  libraryTranscriptionSettingsSuccessResponseSchema,
  libraryTranscriptionUpdateBodySchema,
  videoCaptionListSuccessResponseSchema,
  videoCaptionParamSchema,
  videoCaptionSuccessResponseSchema,
  videoCaptionUpdateBodySchema,
  videoCaptionUploadBodySchema,
  videoTranscriptionRequestBodySchema,
  videoTranscriptionSuccessResponseSchema,
} from "../dto/captions.schemas"
import type { LibraryTranscriptionSettingsService } from "../services/library-transcription-settings.service"
import type { VideoCaptionsService } from "../services/video-captions.service"
import type { VideoTranscriptionsService } from "../services/video-transcriptions.service"

/**
 * Caption tracks and transcriptions of a library's videos, which every
 * member of the active organization manages, and the library's choice of
 * provider, which only the owner changes.
 */
export function createVideoCaptionsRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  videoCaptionsService: VideoCaptionsService,
  videoTranscriptionsService: VideoTranscriptionsService,
  libraryTranscriptionSettingsService: LibraryTranscriptionSettingsService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/captions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listVideoCaptions",
        summary:
          "List a video's caption tracks by language, with its latest transcriptions",
        responses: {
          200: describeJsonResponse(
            "Caption tracks and transcriptions",
            videoCaptionListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.LIST
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/captions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "uploadVideoCaption",
        summary:
          "Upload a WebVTT or SRT file as a caption track of a processed video; a track of the same language and kind is replaced",
        responses: {
          201: describeJsonResponse(
            "Caption track saved",
            videoCaptionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.UPLOAD
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("form", videoCaptionUploadBodySchema, {
        media: "multipart/form-data",
      }),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/captions/:captionId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateVideoCaption",
        summary:
          "Rename a caption track, or make it the one players turn on by themselves",
        responses: {
          200: describeJsonResponse(
            "Caption track saved",
            videoCaptionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.WRITE
          ),
        },
      }),
      validateRequest("param", videoCaptionParamSchema),
      validateRequest("json", videoCaptionUpdateBodySchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/captions/:captionId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deleteVideoCaption",
        summary: "Delete a caption track and its file",
        responses: {
          200: describeJsonResponse(
            "Caption track deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.WRITE
          ),
        },
      }),
      validateRequest("param", videoCaptionParamSchema),
      ...requireMemberOfLibrary,
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
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/captions/:captionId/file",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getVideoCaptionFile",
        summary:
          "Download a caption track's WebVTT, for the web app's player and for editing it elsewhere",
        responses: {
          200: describeBinaryResponse("The WebVTT", "text/vtt"),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.FILE
          ),
        },
      }),
      validateRequest("param", videoCaptionParamSchema),
      ...requireMemberOfLibrary,
      async (c) => {
        const { caption, file } =
          await videoCaptionsService.readCaptionFileForMember(
            c.get("library"),
            c.req.valid("param")
          )

        return new Response(file.body, {
          status: 200,
          headers: {
            "Content-Type": CAPTION_FILE_CONTENT_TYPE,
            "Content-Disposition": `inline; filename="${caption.language}-${caption.kind}.vtt"`,
            "Cache-Control": "no-store",
          },
        })
      }
    )
    .post(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/transcriptions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "requestVideoTranscription",
        summary:
          "Transcribe a processed video into a caption track with the library's provider; the worker does it in the background",
        responses: {
          202: describeJsonResponse(
            "Transcription queued",
            videoTranscriptionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.TRANSCRIBE
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("json", videoTranscriptionRequestBodySchema),
      ...requireMemberOfLibrary,
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
    .get(
      "/:organizationSlug/libraries/:libraryId/transcription",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryTranscriptionSettings",
        summary:
          "Read which provider transcribes the library's videos, and whether it does so by itself",
        responses: {
          200: describeJsonResponse(
            "Transcription settings",
            libraryTranscriptionSettingsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.SETTINGS_GET
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.LIBRARY_SETTINGS_GET,
            await libraryTranscriptionSettingsService.getLibraryTranscription(
              c.get("library")
            )
          ),
          200
        )
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/transcription",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibraryTranscriptionSettings",
        summary:
          "Choose the organization's provider that transcribes the library's videos, and whether each is transcribed once processed",
        responses: {
          200: describeJsonResponse(
            "Transcription settings saved",
            libraryTranscriptionSettingsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.SETTINGS_UPDATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryTranscriptionUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CAPTION_SUCCESS_RESULTS.LIBRARY_SETTINGS_UPDATE,
            await libraryTranscriptionSettingsService.updateLibraryTranscription(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("json")
            )
          ),
          200
        )
    )
}
