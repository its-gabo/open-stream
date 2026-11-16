import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const STORAGE_SUCCESS_CODES = {
  LIST: "storage.list.success",
  CREATE: "storage.create.success",
  GET: "storage.get.success",
  UPDATE: "storage.update.success",
  DELETE: "storage.delete.success",
  TEST: "storage.test.success",
} as const

export const STORAGE_SUCCESS_RESULTS = {
  LIST: {
    code: STORAGE_SUCCESS_CODES.LIST,
    message: "Storages fetched.",
  },
  CREATE: {
    code: STORAGE_SUCCESS_CODES.CREATE,
    message: "Storage created.",
  },
  GET: {
    code: STORAGE_SUCCESS_CODES.GET,
    message: "Storage fetched.",
  },
  UPDATE: {
    code: STORAGE_SUCCESS_CODES.UPDATE,
    message: "Storage updated.",
  },
  DELETE: {
    code: STORAGE_SUCCESS_CODES.DELETE,
    message: "Storage deleted.",
  },
  TEST: {
    code: STORAGE_SUCCESS_CODES.TEST,
    message: "Storage connection tested.",
  },
} as const satisfies ApiResultCatalog<typeof STORAGE_SUCCESS_CODES>
