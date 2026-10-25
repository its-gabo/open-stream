import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { resolveApiToastMessage } from "@/lib/api-toast-message"
import { API_TOAST_MESSAGE_TYPE } from "@/lib/api-toast-message.constants"

/** Toasts translated from the API `code` of a success response or error. */
export function useApiToast() {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      showSuccessToast: (response: unknown) =>
        toast.success(
          resolveApiToastMessage(response, t, API_TOAST_MESSAGE_TYPE.SUCCESS)
        ),
      showErrorToast: (error: unknown) =>
        toast.error(
          resolveApiToastMessage(error, t, API_TOAST_MESSAGE_TYPE.ERROR)
        ),
    }),
    [t]
  )
}
