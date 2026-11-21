import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const CHAPTER_GENERATION_SUCCESS_CODES = {
  PROVIDER_LIST: "chapter_generation_provider.list.success",
  PROVIDER_CREATE: "chapter_generation_provider.create.success",
  PROVIDER_UPDATE: "chapter_generation_provider.update.success",
  PROVIDER_DELETE: "chapter_generation_provider.delete.success",
  PROVIDER_TEST: "chapter_generation_provider.test.success",
  LIBRARY_SETTINGS_GET: "library.chapter_generation.get.success",
  LIBRARY_SETTINGS_UPDATE: "library.chapter_generation.update.success",
  SUGGESTIONS: "video.chapter_suggestions.success",
} as const

export const CHAPTER_GENERATION_SUCCESS_RESULTS = {
  PROVIDER_LIST: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.PROVIDER_LIST,
    message: "Chapter generation providers fetched.",
  },
  PROVIDER_CREATE: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.PROVIDER_CREATE,
    message: "Chapter generation provider created.",
  },
  PROVIDER_UPDATE: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.PROVIDER_UPDATE,
    message: "Chapter generation provider saved.",
  },
  PROVIDER_DELETE: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.PROVIDER_DELETE,
    message: "Chapter generation provider deleted.",
  },
  PROVIDER_TEST: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.PROVIDER_TEST,
    message: "Connection tested.",
  },
  LIBRARY_SETTINGS_GET: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.LIBRARY_SETTINGS_GET,
    message: "Chapter generation settings fetched.",
  },
  LIBRARY_SETTINGS_UPDATE: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.LIBRARY_SETTINGS_UPDATE,
    message: "Chapter generation settings saved.",
  },
  SUGGESTIONS: {
    code: CHAPTER_GENERATION_SUCCESS_CODES.SUGGESTIONS,
    message: "Chapters suggested.",
  },
} as const satisfies ApiResultCatalog<typeof CHAPTER_GENERATION_SUCCESS_CODES>
