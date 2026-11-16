import { TUS_VERSION, VIDEO_UPLOAD_LIMITS } from "@workspace/shared"
import { Hono } from "hono"
import { every } from "hono/combine"
import { describeRoute } from "hono-openapi"
import { DomainError } from "../../common/errors/domain-error"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import {
  TUS_EXTENSIONS,
  TUS_HEADERS,
  TUS_METADATA_KEYS,
  TUS_PATCH_CONTENT_TYPE,
  VIDEO_UPLOAD_MAX_CHUNK_BYTES,
} from "../constants/libraries.constants"
import {
  videoParamSchema,
  videoUploadParamSchema,
} from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import { requireLibrary } from "../middleware/library-access.middleware"
import { requireTusProtocol } from "../middleware/tus.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { VideoUploadsService } from "../services/video-uploads.service"
import type {
  LibraryScopedEnv,
  VideoUploadRoutesOptions,
} from "../types/libraries.types"
import { parseTusInteger, parseTusMetadata } from "../utils/tus.utils"

/** Members upload through the web app with their session. */
export function createVideoUploadsRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  videoUploadsService: VideoUploadsService
) {
  return createVideoUploadRoutes(videoUploadsService, {
    uploadsPath:
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/uploads",
    videoParamSchema,
    uploadParamSchema: videoUploadParamSchema,
    requireUploadAccess: every(
      requireOrganizationMembership(organizationsService),
      requireActiveOrganization,
      requireLibrary(librariesService)
    ),
  })
}

/**
 * tus 1.0 endpoints (core, creation and termination) that upload a video's
 * file in resumable chunks. They speak headers rather than JSON, so they are
 * left out of the OpenAPI document. The upload's `Location` extends the
 * request path, so it stays under whichever API the upload started on.
 */
export function createVideoUploadRoutes(
  videoUploadsService: VideoUploadsService,
  options: VideoUploadRoutesOptions
) {
  const { uploadsPath, requireUploadAccess } = options
  const uploadPath = `${uploadsPath}/:uploadId`

  return new Hono<LibraryScopedEnv>()
    .post(
      uploadsPath,
      describeRoute({ hide: true }),
      validateRequest("param", options.videoParamSchema),
      requireTusProtocol,
      requireUploadAccess,
      async (c) => {
        const videoId = c.req.param("videoId")
        const metadata = parseTusMetadata(
          c.req.header(TUS_HEADERS.UPLOAD_METADATA)
        )
        const { uploadId } = await videoUploadsService.startUpload(
          c.get("library"),
          videoId!,
          {
            uploadLength: parseTusInteger(
              c.req.header(TUS_HEADERS.UPLOAD_LENGTH)
            ),
            fileName: metadata.get(TUS_METADATA_KEYS.FILE_NAME) ?? "",
          }
        )

        return c.body(null, 201, {
          [TUS_HEADERS.LOCATION]: `${c.req.path}/${uploadId}`,
        })
      }
    )
    .get(
      // Serves the tus HEAD request too: Hono answers HEAD with the GET handler.
      uploadPath,
      describeRoute({ hide: true }),
      validateRequest("param", options.uploadParamSchema),
      requireTusProtocol,
      requireUploadAccess,
      async (c) => {
        const videoId = c.req.param("videoId")
        const uploadId = c.req.param("uploadId")
        const progress = await videoUploadsService.getUploadProgress(
          c.get("library"),
          videoId!,
          uploadId!
        )

        return c.body(null, 200, {
          [TUS_HEADERS.UPLOAD_OFFSET]: String(progress.uploadOffset),
          [TUS_HEADERS.UPLOAD_LENGTH]: String(progress.uploadLength),
        })
      }
    )
    .patch(
      uploadPath,
      describeRoute({ hide: true }),
      validateRequest("param", options.uploadParamSchema),
      requireTusProtocol,
      requireUploadAccess,
      async (c) => {
        if (c.req.header("content-type") !== TUS_PATCH_CONTENT_TYPE) {
          throw new DomainError(LIBRARY_ERRORS.INVALID_UPLOAD_REQUEST)
        }

        // Rejected before the body is read, so an oversized chunk is never buffered.
        if (
          parseTusInteger(c.req.header("content-length")) >
          VIDEO_UPLOAD_MAX_CHUNK_BYTES
        ) {
          throw new DomainError(LIBRARY_ERRORS.FILE_TOO_LARGE)
        }

        const videoId = c.req.param("videoId")
        const uploadId = c.req.param("uploadId")
        const progress = await videoUploadsService.appendChunk(
          c.get("library"),
          c.get("activityActor"),
          videoId!,
          uploadId!,
          {
            uploadOffset: parseTusInteger(
              c.req.header(TUS_HEADERS.UPLOAD_OFFSET)
            ),
            bytes: new Uint8Array(await c.req.arrayBuffer()),
          }
        )

        return c.body(null, 204, {
          [TUS_HEADERS.UPLOAD_OFFSET]: String(progress.uploadOffset),
        })
      }
    )
    .delete(
      uploadPath,
      describeRoute({ hide: true }),
      validateRequest("param", options.uploadParamSchema),
      requireTusProtocol,
      requireUploadAccess,
      async (c) => {
        const videoId = c.req.param("videoId")
        const uploadId = c.req.param("uploadId")

        await videoUploadsService.terminateUpload(
          c.get("library"),
          c.get("activityActor"),
          videoId!,
          uploadId!
        )

        return c.body(null, 204)
      }
    )
    .options(uploadsPath, describeRoute({ hide: true }), (c) =>
      c.body(null, 204, {
        [TUS_HEADERS.RESUMABLE]: TUS_VERSION,
        [TUS_HEADERS.VERSION]: TUS_VERSION,
        [TUS_HEADERS.EXTENSION]: TUS_EXTENSIONS,
        [TUS_HEADERS.MAX_SIZE]: String(VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES),
      })
    )
}
