import { match } from "ts-pattern"

import { API_TOAST_MESSAGE_TYPE } from "./api-toast-message.constants"
import type {
  ApiResponseWithCode,
  ApiToastMessageType,
} from "./api-toast-message.types"

import type { TranslationFunction } from "@/i18n/i18n.types"

function normalizeCode(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function readCode(value: unknown) {
  if (!value || typeof value !== "object") return null

  return normalizeCode((value as ApiResponseWithCode).code)
}

/** The generated client rejects with the `Response`, carrying the parsed error body in `error`. */
function readResponseBody(input: unknown) {
  return input instanceof Response && "error" in input ? input.error : input
}

export function getApiCode(input: unknown) {
  return readCode(readResponseBody(input))
}

/** Translates the API `code` of a response or error into a toast message. */
export function resolveApiToastMessage(
  input: unknown,
  t: TranslationFunction,
  type: ApiToastMessageType
) {
  const fallbackMessage = t("api.error.fallback")

  const code = getApiCode(input)

  if (!code) return fallbackMessage

  const key = match(type)
    .with(API_TOAST_MESSAGE_TYPE.SUCCESS, () => `api.success.${code}`)
    .with(API_TOAST_MESSAGE_TYPE.ERROR, () => `api.error.${code}`)
    .exhaustive()

  return t(key, { defaultValue: fallbackMessage })
}
