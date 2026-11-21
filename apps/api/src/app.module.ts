import { createActivityModule } from "./activity/activity.module"
import { createAnalyticsModule } from "./analytics/analytics.module"
import { createAuthModule } from "./auth/auth.module"
import { createCaptionsModule } from "./captions/captions.module"
import type { TranscriptionClient } from "./captions/types/captions.types"
import { createChapterGenerationModule } from "./chapter-generation/chapter-generation.module"
import type { ChapterGenerationClient } from "./chapter-generation/types/chapter-generation.types"
import { createCtasModule } from "./ctas/ctas.module"
import { createLoggingModule } from "./common/logging/logging.module"
import type { LogSink } from "./common/logging/logging.types"
import type { AppConfig } from "./config/app.config"
import { createDatabase } from "./db/database"
import { createEmailModule } from "./email/email.module"
import { createLibrariesModule } from "./libraries/libraries.module"
import { createMediaModule } from "./media/media.module"
import type { MediaToolkit } from "./media/types/media.types"
import { createOrganizationsModule } from "./organizations/organizations.module"
import { createOutboxModule } from "./outbox/outbox.module"
import { createPlaylistsModule } from "./playlists/playlists.module"
import { createStorageModule } from "./storage/storage.module"
import type { ObjectStorage } from "./storage/types/storage.types"
import { createWebhooksModule } from "./webhooks/webhooks.module"

/** External providers the composition root can be given instead of the real ones, e.g. by tests. */
export type AppModuleOverrides = {
  objectStorage?: ObjectStorage
  logSink?: LogSink
  mediaToolkit?: MediaToolkit
  transcriptionClient?: TranscriptionClient
  chapterGenerationClient?: ChapterGenerationClient
}

/**
 * The composition root: creates every repository and service once, passing dependencies
 * through constructors. The API server, the worker and tests all start from here.
 */
export function createAppModule(
  config: AppConfig,
  overrides: AppModuleOverrides = {}
) {
  const logging = createLoggingModule({ config, logSink: overrides.logSink })
  const database = createDatabase(config.DATABASE_URL)
  const outbox = createOutboxModule({ db: database.db })
  const email = createEmailModule({ config })
  const activity = createActivityModule({ db: database.db })
  const auth = createAuthModule({
    db: database.db,
    config,
    outboxService: outbox.outboxService,
    activityLogService: activity.activityLogService,
  })
  const storage = createStorageModule({
    db: database.db,
    config,
    logger: logging.logger,
    outboxService: outbox.outboxService,
    activityLogService: activity.activityLogService,
    objectStorage: overrides.objectStorage,
  })
  const media = createMediaModule({
    config,
    mediaToolkit: overrides.mediaToolkit,
  })
  const webhooks = createWebhooksModule({
    db: database.db,
    config,
    logger: logging.logger,
    outboxService: outbox.outboxService,
    storageSecretCipherService: storage.storageSecretCipherService,
    activityLogService: activity.activityLogService,
  })
  const libraries = createLibrariesModule({
    db: database.db,
    config,
    logger: logging.logger,
    outboxService: outbox.outboxService,
    webhookEventsService: webhooks.webhookEventsService,
    activityLogService: activity.activityLogService,
    ...storage,
    ...media,
  })
  const analytics = createAnalyticsModule({
    db: database.db,
    videoPlaybackService: libraries.videoPlaybackService,
  })
  const playlists = createPlaylistsModule({
    db: database.db,
    config,
    activityLogService: activity.activityLogService,
    videoPlaybackService: libraries.videoPlaybackService,
  })
  const ctas = createCtasModule({
    db: database.db,
    activityLogService: activity.activityLogService,
    videoPlaybackService: libraries.videoPlaybackService,
    webhookEventsService: webhooks.webhookEventsService,
  })
  const captions = createCaptionsModule({
    db: database.db,
    config,
    logger: logging.logger,
    outboxService: outbox.outboxService,
    activityLogService: activity.activityLogService,
    webhookEventsService: webhooks.webhookEventsService,
    videoPlaybackService: libraries.videoPlaybackService,
    libraryStorageService: libraries.libraryStorageService,
    storageSecretCipherService: storage.storageSecretCipherService,
    objectStorage: storage.objectStorage,
    mediaToolkit: media.mediaToolkit,
    transcriptionClient: overrides.transcriptionClient,
  })
  const chapterGeneration = createChapterGenerationModule({
    db: database.db,
    config,
    logger: logging.logger,
    activityLogService: activity.activityLogService,
    storageSecretCipherService: storage.storageSecretCipherService,
    videoCaptionsService: captions.videoCaptionsService,
    chapterGenerationClient: overrides.chapterGenerationClient,
  })
  const organizations = createOrganizationsModule({
    db: database.db,
    config,
    logger: logging.logger,
    outboxService: outbox.outboxService,
    authTokenService: auth.authTokenService,
    activityLogService: activity.activityLogService,
    videoFilesCleanupService: libraries.videoFilesCleanupService,
  })

  return {
    config,
    db: database.db,
    ...logging,
    ...outbox,
    ...email,
    ...auth,
    ...activity,
    ...organizations,
    ...storage,
    ...media,
    ...webhooks,
    ...libraries,
    ...analytics,
    ...playlists,
    ...ctas,
    ...captions,
    ...chapterGeneration,
    async close() {
      email.emailSenderService.close()
      await database.close()
    },
  }
}

export type AppModule = ReturnType<typeof createAppModule>
