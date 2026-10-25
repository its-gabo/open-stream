import type { SUPPORTED_LANGUAGES } from "../constants/languages.constants"

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES]
