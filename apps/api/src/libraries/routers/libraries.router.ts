import { Hono } from "hono"
import { requireSession } from "../../auth/middleware/session.middleware"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import { createLibraryAnalyticsRouter } from "../../analytics/routers/library-analytics.router"
import { createLibraryWebhooksRouter } from "../../webhooks/routers/library-webhooks.router"
import { createLibrariesCoreRouter } from "./libraries-core.router"
import { createLibraryApiAccessRouter } from "./library-api-access.router"
import { createLibraryEncodingRouter } from "./library-encoding.router"
import { createLibraryStorageRouter } from "./library-storage.router"
import { createVideoUploadsRouter } from "./video-uploads.router"
import { createVideosRouter } from "./videos.router"
import type { LibrariesRouterDependencies } from "../types/libraries.types"

/** Libraries live inside an organization; every route requires a session. Mount at the API root. */
export function createLibrariesRouter(module: LibrariesRouterDependencies) {
  const session = requireSession(
    module.authSessionService,
    module.authCookieService
  )

  return new Hono().route(
    "/organizations",
    new Hono<AuthenticatedEnv>()
      .use(session)
      .route(
        "/",
        createLibrariesCoreRouter(
          module.organizationsService,
          module.librariesService
        )
      )
      .route(
        "/",
        createLibraryStorageRouter(
          module.organizationsService,
          module.librariesService,
          module.libraryStorageService
        )
      )
      .route(
        "/",
        createLibraryEncodingRouter(
          module.organizationsService,
          module.librariesService
        )
      )
      .route(
        "/",
        createLibraryApiAccessRouter(
          module.organizationsService,
          module.librariesService,
          module.libraryApiAccessService
        )
      )
      .route(
        "/",
        createLibraryAnalyticsRouter(
          module.organizationsService,
          module.librariesService,
          module.videoAnalyticsService
        )
      )
      .route(
        "/",
        createLibraryWebhooksRouter(
          module.organizationsService,
          module.librariesService,
          module.libraryWebhooksService
        )
      )
      .route(
        "/",
        createVideosRouter(
          module.organizationsService,
          module.librariesService,
          module.videosService,
          module.videoProcessingService,
          module.videoPlaybackService
        )
      )
      .route(
        "/",
        createVideoUploadsRouter(
          module.organizationsService,
          module.librariesService,
          module.videoUploadsService
        )
      )
  )
}
