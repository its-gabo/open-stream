import { OUTBOX_MESSAGE_TYPES } from "../outbox/constants/outbox.constants"
import type { OutboxMessageHandlers } from "../outbox/types/outbox.types"
import { StorageCleanupsRepository } from "./repository/storage-cleanups.repository"
import { StoragesRepository } from "./repository/storages.repository"
import { StorageCleanupService } from "./services/storage-cleanup.service"
import { S3ObjectStorageService } from "./services/s3-object-storage.service"
import { StorageSecretCipherService } from "./services/storage-secret-cipher.service"
import { StoragesService } from "./services/storages.service"
import type {
  StorageLocation,
  StorageModuleDependencies,
} from "./types/storage.types"

export function createStorageModule(dependencies: StorageModuleDependencies) {
  const { db, config, outboxService, activityLogService, logger } = dependencies

  const defaultStorageLocation: StorageLocation = {
    endpoint: config.OBJECT_STORAGE_ENDPOINT,
    region: config.OBJECT_STORAGE_REGION,
    bucket: config.OBJECT_STORAGE_BUCKET,
    forcePathStyle: config.OBJECT_STORAGE_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: config.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    },
  }
  const objectStorage =
    dependencies.objectStorage ?? new S3ObjectStorageService()
  const storageSecretCipherService = new StorageSecretCipherService(config)
  const storagesService = new StoragesService(
    new StoragesRepository(db),
    objectStorage,
    storageSecretCipherService,
    activityLogService,
    logger.child("storage"),
    config
  )
  const storageCleanupService = new StorageCleanupService(
    new StorageCleanupsRepository(db),
    objectStorage,
    storagesService,
    outboxService,
    defaultStorageLocation,
    logger.child("storage-cleanup")
  )

  return {
    objectStorage,
    storageSecretCipherService,
    defaultStorageLocation,
    storagesService,
    storageCleanupService,
    storageOutboxMessageHandlers: {
      [OUTBOX_MESSAGE_TYPES.CLEAN_UP_STORAGE]: (payload) =>
        storageCleanupService.runCleanup(payload),
    } satisfies Pick<
      OutboxMessageHandlers,
      typeof OUTBOX_MESSAGE_TYPES.CLEAN_UP_STORAGE
    >,
  }
}

export type StorageModule = ReturnType<typeof createStorageModule>
