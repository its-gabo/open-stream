import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { AuthSession, AuthUser, AuthSignInBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { AUTH_SESSION_QUERY_KEY } from "@/modules/auth/auth.query-keys"

export function useAuthSignInMutation(
  options: ApiMutationOptions<AuthUser> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: AuthSignInBody) =>
      apiClient.auth.signInWithEmail(payload),
    onSuccess: (response) => {
      const { user } = response.data

      const session: AuthSession = { authenticated: true, user }

      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session)

      showSuccessToast(response)
      options.onSuccess?.(user)
    },
    onError: showErrorToast,
  })
}
