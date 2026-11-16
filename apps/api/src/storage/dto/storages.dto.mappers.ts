import type { StorageSummary } from "../types/storage.types"
import type { StorageDto } from "./storages.schemas"

export const toStorageDto = (storage: StorageSummary): StorageDto => ({
  id: storage.id,
  name: storage.name,
  endpoint: storage.endpoint,
  region: storage.region,
  bucket: storage.bucket,
  forcePathStyle: storage.forcePathStyle,
  pathTemplate: storage.pathTemplate,
  accessKeyIdHint: storage.accessKeyIdHint,
  libraryCount: storage.libraryCount,
  isLocked: storage.isLocked,
  createdAt: storage.createdAt.toISOString(),
  updatedAt: storage.updatedAt.toISOString(),
})
