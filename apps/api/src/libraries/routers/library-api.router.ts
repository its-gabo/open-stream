import { LIBRARY_API_KEY_SCOPES } from "@workspace/shared"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { LIBRARY_API_PATH } from "../constants/library-api.constants"
import { TUS_HEADERS } from "../constants/libraries.constants"
import {
  publicVideoParamSchema,
  publicVideoUploadParamSchema,
} from "../dto/libraries.schemas"
import type { AnalyticsModule } from "../../analytics/analytics.module"
import type { CtasModule } from "../../ctas/ctas.module"
import { createLibraryApiCtasRouter } from "../../ctas/routers/library-api-ctas.router"
import { createVideoCtaPlaybackRouter } from "../../ctas/routers/video-cta-playback.router"
import type { PlaylistsModule } from "../../playlists/playlists.module"
import { createLibraryApiPlaylistsRouter } from "../../playlists/routers/library-api-playlists.router"
import { createPlaylistPlaybackRouter } from "../../playlists/routers/playlist-playback.router"
import { createLibraryApiAnalyticsRouter } from "../../analytics/routers/library-api-analytics.router"
import { createVideoViewsRouter } from "../../analytics/routers/video-views.router"
import type { LibrariesModule } from "../libraries.module"
import { requireLibraryApiKey } from "../middleware/library-api-key.middleware"
import { createLibraryApiVideosRouter } from "./library-api-videos.router"
import { createVideoUploadRoutes } from "./video-uploads.router"
import { createVideoPlaybackRouter } from "./video-playback.router"

/**
 * The public library API, authenticated with each library's API key instead
 * of a session. It sends no cookies, so it is open to any origin. Mount at
 * the API root.
 */
export function createLibraryApiRouter(
  module: LibrariesModule & AnalyticsModule & PlaylistsModule & CtasModule
) {
  return new Hono().route(
    LIBRARY_API_PATH,
    new Hono()
      .use(
        cors({
          origin: "*",
          allowHeaders: [
            "Authorization",
            "Content-Type",
            "Range",
            TUS_HEADERS.RESUMABLE,
            TUS_HEADERS.UPLOAD_LENGTH,
            TUS_HEADERS.UPLOAD_OFFSET,
            TUS_HEADERS.UPLOAD_METADATA,
          ],
          allowMethods: [
            "GET",
            "HEAD",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
          ],
          exposeHeaders: [
            TUS_HEADERS.LOCATION,
            TUS_HEADERS.RESUMABLE,
            TUS_HEADERS.UPLOAD_OFFSET,
            TUS_HEADERS.UPLOAD_LENGTH,
            "Content-Length",
            "Content-Range",
            "Accept-Ranges",
          ],
        })
      )
      .route("/", createVideoPlaybackRouter(module.videoPlaybackService))
      .route("/", createPlaylistPlaybackRouter(module.playlistPlaybackService))
      .route("/", createVideoViewsRouter(module.videoViewsService))
      .route(
        "/",
        createVideoCtaPlaybackRouter(module.videoCtaPlaybackService)
      )
      .route(
        "/",
        createLibraryApiAnalyticsRouter(
          module.libraryApiAccessService,
          module.videoAnalyticsService
        )
      )
      .route(
        "/",
        createLibraryApiVideosRouter(
          module.libraryApiAccessService,
          module.videosService,
          module.videoPlaybackService,
          module.videoProcessingService,
          module.videoPostersService,
          module.videoImportsService
        )
      )
      .route(
        "/",
        createLibraryApiPlaylistsRouter(
          module.libraryApiAccessService,
          module.playlistsService,
          module.playlistPlaybackService
        )
      )
      .route(
        "/",
        createLibraryApiCtasRouter(
          module.libraryApiAccessService,
          module.videoCtasService,
          module.videoCtaLeadsService
        )
      )
      .route(
        "/",
        createVideoUploadRoutes(module.videoUploadsService, {
          uploadsPath: "/:libraryId/videos/:videoId/uploads",
          videoParamSchema: publicVideoParamSchema,
          uploadParamSchema: publicVideoUploadParamSchema,
          requireUploadAccess: requireLibraryApiKey(
            module.libraryApiAccessService,
            LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD
          ),
        })
      )
  )
}
