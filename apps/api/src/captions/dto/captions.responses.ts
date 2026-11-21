import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const VIDEO_CAPTION_SUCCESS_CODES = {
  LIST: "video.caption.list.success",
  UPLOAD: "video.caption.upload.success",
  UPDATE: "video.caption.update.success",
  DELETE: "video.caption.delete.success",
  EMBED_LIST: "video.caption.embed.list.success",
  TRANSCRIPTION_REQUEST: "video.transcription.request.success",
  PROVIDER_LIST: "transcription_provider.list.success",
  PROVIDER_CREATE: "transcription_provider.create.success",
  PROVIDER_UPDATE: "transcription_provider.update.success",
  PROVIDER_DELETE: "transcription_provider.delete.success",
  PROVIDER_TEST: "transcription_provider.test.success",
  LIBRARY_SETTINGS_GET: "library.transcription.get.success",
  LIBRARY_SETTINGS_UPDATE: "library.transcription.update.success",
} as const

export const VIDEO_CAPTION_SUCCESS_RESULTS = {
  LIST: {
    code: VIDEO_CAPTION_SUCCESS_CODES.LIST,
    message: "Caption tracks fetched.",
  },
  UPLOAD: {
    code: VIDEO_CAPTION_SUCCESS_CODES.UPLOAD,
    message: "Caption track saved.",
  },
  UPDATE: {
    code: VIDEO_CAPTION_SUCCESS_CODES.UPDATE,
    message: "Caption track saved.",
  },
  DELETE: {
    code: VIDEO_CAPTION_SUCCESS_CODES.DELETE,
    message: "Caption track deleted.",
  },
  EMBED_LIST: {
    code: VIDEO_CAPTION_SUCCESS_CODES.EMBED_LIST,
    message: "Caption tracks fetched.",
  },
  TRANSCRIPTION_REQUEST: {
    code: VIDEO_CAPTION_SUCCESS_CODES.TRANSCRIPTION_REQUEST,
    message: "Transcription queued.",
  },
  PROVIDER_LIST: {
    code: VIDEO_CAPTION_SUCCESS_CODES.PROVIDER_LIST,
    message: "Transcription providers fetched.",
  },
  PROVIDER_CREATE: {
    code: VIDEO_CAPTION_SUCCESS_CODES.PROVIDER_CREATE,
    message: "Transcription provider created.",
  },
  PROVIDER_UPDATE: {
    code: VIDEO_CAPTION_SUCCESS_CODES.PROVIDER_UPDATE,
    message: "Transcription provider saved.",
  },
  PROVIDER_DELETE: {
    code: VIDEO_CAPTION_SUCCESS_CODES.PROVIDER_DELETE,
    message: "Transcription provider deleted.",
  },
  PROVIDER_TEST: {
    code: VIDEO_CAPTION_SUCCESS_CODES.PROVIDER_TEST,
    message: "Connection tested.",
  },
  LIBRARY_SETTINGS_GET: {
    code: VIDEO_CAPTION_SUCCESS_CODES.LIBRARY_SETTINGS_GET,
    message: "Transcription settings fetched.",
  },
  LIBRARY_SETTINGS_UPDATE: {
    code: VIDEO_CAPTION_SUCCESS_CODES.LIBRARY_SETTINGS_UPDATE,
    message: "Transcription settings saved.",
  },
} as const satisfies ApiResultCatalog<typeof VIDEO_CAPTION_SUCCESS_CODES>
