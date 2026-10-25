import type { API_TOAST_MESSAGE_TYPE } from "./api-toast-message.constants"

export type ApiToastMessageType =
  (typeof API_TOAST_MESSAGE_TYPE)[keyof typeof API_TOAST_MESSAGE_TYPE]

export type ApiResponseWithCode = {
  code?: unknown
}
