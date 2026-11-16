import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"
import type { StorageRecord } from "../../db/schema"

export const storageActivityResource = (
  storage: Pick<StorageRecord, "id" | "name">
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.STORAGE,
  id: storage.id,
  label: storage.name,
})

/** What the activity log keeps of a storage: its connection, never its credentials. */
export const toStorageActivityValues = (
  storage: Pick<
    StorageRecord,
    | "name"
    | "endpoint"
    | "region"
    | "bucket"
    | "forcePathStyle"
    | "pathTemplate"
    | "accessKeyIdHint"
  >
) => ({
  name: storage.name,
  endpoint: storage.endpoint,
  region: storage.region,
  bucket: storage.bucket,
  forcePathStyle: storage.forcePathStyle,
  pathTemplate: storage.pathTemplate,
  accessKeyIdHint: storage.accessKeyIdHint,
})
