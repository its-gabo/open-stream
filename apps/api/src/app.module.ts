import { createActivityModule } from "./activity/activity.module"
import { createAnalyticsModule } from "./analytics/analytics.module"
import { createAuthModule } from "./auth/auth.module"
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
import { createStorageModule } from "./storage/storage.module"
import type { ObjectStorage } from "./storage/types/storage.types"
import { createWebhooksModule } from "./webhooks/webhooks.module"

/** External providers the composition root can be given instead of the real ones, e.g. by tests. */
export type AppModuleOverrides = {
  objectStorage?: ObjectStorage
  logSink?: LogSink
  mediaToolkit?: MediaToolkit
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
    async close() {
      email.emailSenderService.close()
      await database.close()
    },
  }
}

export type AppModule = ReturnType<typeof createAppModule>
