import type { z } from "zod"

import type {
  STORAGE_ADDRESSING_STYLES,
  STORAGE_CONNECTION_STATES,
} from "./storages.constants"
import type { storageFormSchema } from "./storages.schemas"

export type StorageFormValues = z.infer<ReturnType<typeof storageFormSchema>>

export type StorageAddressingStyle =
  (typeof STORAGE_ADDRESSING_STYLES)[keyof typeof STORAGE_ADDRESSING_STYLES]

export type StorageConnectionState =
  (typeof STORAGE_CONNECTION_STATES)[keyof typeof STORAGE_CONNECTION_STATES]
