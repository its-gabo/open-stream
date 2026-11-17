import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const LIBRARY_SUCCESS_CODES = {
  LIST: "library.list.success",
  CREATE: "library.create.success",
  GET: "library.get.success",
  UPDATE: "library.update.success",
  STORAGE_GET: "library.storage.get.success",
  STORAGE_UPDATE: "library.storage.update.success",
  VIDEO_LIST: "video.list.success",
  VIDEO_CREATE: "video.create.success",
  VIDEO_GET: "video.get.success",
  VIDEO_UPDATE: "video.update.success",
  VIDEO_DELETE: "video.delete.success",
  API_ACCESS_GET: "library.api_access.get.success",
  API_KEY_CREATE: "library.api_key.create.success",
  API_KEY_UPDATE: "library.api_key.update.success",
  API_KEY_ROLL: "library.api_key.roll.success",
  API_KEY_DELETE: "library.api_key.delete.success",
  SECURITY_UPDATE: "library.security.update.success",
  PLAYBACK_URL_CREATE: "video.playback_url.create.success",
  ENCODING_GET: "library.encoding.get.success",
  ENCODING_UPDATE: "library.encoding.update.success",
  VIDEO_REPROCESS: "video.reprocess.success",
  VIDEO_STATUS_GET: "video.status.get.success",
  VIDEO_EMBED_GET: "video.embed.get.success",
} as const

export const LIBRARY_SUCCESS_RESULTS = {
  LIST: {
    code: LIBRARY_SUCCESS_CODES.LIST,
    message: "Libraries fetched.",
  },
  CREATE: {
    code: LIBRARY_SUCCESS_CODES.CREATE,
    message: "Library created.",
  },
  GET: {
    code: LIBRARY_SUCCESS_CODES.GET,
    message: "Library fetched.",
  },
  UPDATE: {
    code: LIBRARY_SUCCESS_CODES.UPDATE,
    message: "Library updated.",
  },
  STORAGE_GET: {
    code: LIBRARY_SUCCESS_CODES.STORAGE_GET,
    message: "Library storage fetched.",
  },
  STORAGE_UPDATE: {
    code: LIBRARY_SUCCESS_CODES.STORAGE_UPDATE,
    message: "Library storage changed.",
  },
  VIDEO_LIST: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_LIST,
    message: "Videos fetched.",
  },
  VIDEO_CREATE: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_CREATE,
    message: "Video created.",
  },
  VIDEO_GET: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_GET,
    message: "Video fetched.",
  },
  VIDEO_UPDATE: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_UPDATE,
    message: "Video updated.",
  },
  VIDEO_DELETE: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_DELETE,
    message: "Video deleted.",
  },
  API_ACCESS_GET: {
    code: LIBRARY_SUCCESS_CODES.API_ACCESS_GET,
    message: "Library API access fetched.",
  },
  API_KEY_CREATE: {
    code: LIBRARY_SUCCESS_CODES.API_KEY_CREATE,
    message: "Library API key created.",
  },
  API_KEY_UPDATE: {
    code: LIBRARY_SUCCESS_CODES.API_KEY_UPDATE,
    message: "Library API key updated.",
  },
  API_KEY_ROLL: {
    code: LIBRARY_SUCCESS_CODES.API_KEY_ROLL,
    message: "Library API key replaced with a new secret.",
  },
  API_KEY_DELETE: {
    code: LIBRARY_SUCCESS_CODES.API_KEY_DELETE,
    message: "Library API key revoked.",
  },
  SECURITY_UPDATE: {
    code: LIBRARY_SUCCESS_CODES.SECURITY_UPDATE,
    message: "Library security settings saved.",
  },
  PLAYBACK_URL_CREATE: {
    code: LIBRARY_SUCCESS_CODES.PLAYBACK_URL_CREATE,
    message: "Playback URL created.",
  },
  VIDEO_EMBED_GET: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_EMBED_GET,
    message: "Video embed fetched.",
  },
  ENCODING_GET: {
    code: LIBRARY_SUCCESS_CODES.ENCODING_GET,
    message: "Library encoding settings fetched.",
  },
  ENCODING_UPDATE: {
    code: LIBRARY_SUCCESS_CODES.ENCODING_UPDATE,
    message: "Library encoding settings saved.",
  },
  VIDEO_REPROCESS: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_REPROCESS,
    message: "Video queued for processing.",
  },
  VIDEO_STATUS_GET: {
    code: LIBRARY_SUCCESS_CODES.VIDEO_STATUS_GET,
    message: "Video status fetched.",
  },
} as const satisfies ApiResultCatalog<typeof LIBRARY_SUCCESS_CODES>
