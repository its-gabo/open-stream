import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { AuthSession } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { AUTH_SESSION_QUERY_KEY } from "@/modules/auth/auth.query-keys"

export function useAuthSignOutMutation(options: ApiMutationOptions = {}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: () => apiClient.auth.signOut(),
    onSuccess: (response) => {
      const session: AuthSession = { authenticated: false }

      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session)

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
