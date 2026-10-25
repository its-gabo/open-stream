import { useMutation } from "@tanstack/react-query"

import type { AuthResetPasswordBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

export function useAuthResetPasswordMutation(options: ApiMutationOptions = {}) {
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: AuthResetPasswordBody) =>
      apiClient.auth.resetPassword(payload),
    onSuccess: (response) => {
      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
