import {
  DEFAULT_STORAGE_PATH_TEMPLATE,
  isValidStoragePathTemplate,
  renderStoragePath,
} from "@workspace/shared"

import {
  STORAGE_ADDRESSING_STYLES,
  STORAGE_PATH_PREVIEW_VALUES,
} from "./storages.constants"

import type { Storage } from "@/api/generated-api"
import type { StorageFormValues } from "./storages.types"

export const toStorageFormValues = (
  storage: Storage | null
): StorageFormValues => ({
  name: storage?.name ?? "",
  endpoint: storage?.endpoint ?? "",
  region: storage?.region ?? "",
  bucket: storage?.bucket ?? "",
  addressingStyle:
    storage?.forcePathStyle === false
      ? STORAGE_ADDRESSING_STYLES.VIRTUAL_HOSTED
      : STORAGE_ADDRESSING_STYLES.PATH,
  pathTemplate: storage?.pathTemplate ?? DEFAULT_STORAGE_PATH_TEMPLATE,
  accessKeyId: "",
  secretAccessKey: "",
})

/** The connection part of the form, as the API expects it. */
export const toStorageConnection = ({
  endpoint,
  region,
  bucket,
  addressingStyle,
}: StorageFormValues) => ({
  endpoint,
  region,
  bucket,
  forcePathStyle: addressingStyle === STORAGE_ADDRESSING_STYLES.PATH,
})

/** An example object key the path template renders to, or null while it is invalid. */
export const buildStoragePathPreview = (pathTemplate: string) =>
  isValidStoragePathTemplate(pathTemplate)
    ? `${renderStoragePath(pathTemplate, STORAGE_PATH_PREVIEW_VALUES)}/source`
    : null
