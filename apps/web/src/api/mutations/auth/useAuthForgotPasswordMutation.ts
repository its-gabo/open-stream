import { useMutation } from "@tanstack/react-query"

import type { AuthForgotPasswordBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

export function useAuthForgotPasswordMutation(
  options: ApiMutationOptions = {}
) {
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: AuthForgotPasswordBody) =>
      apiClient.auth.requestPasswordReset(payload),
    onSuccess: (response) => {
      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
