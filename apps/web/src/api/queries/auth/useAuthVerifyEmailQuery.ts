import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { VERIFY_EMAIL_MIN_PENDING_MS } from "@/modules/auth/auth.constants"
import { AUTH_VERIFY_EMAIL_QUERY_KEY } from "@/modules/auth/auth.query-keys"

/** Verification tokens are single-use, so the result is never refetched. */
export function useAuthVerifyEmailQuery(token: string | undefined) {
  return useQuery({
    queryKey: [...AUTH_VERIFY_EMAIL_QUERY_KEY, token],
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      if (!token) return null

      await new Promise((resolve) =>
        setTimeout(resolve, VERIFY_EMAIL_MIN_PENDING_MS)
      )

      return apiClient.auth.verifyEmail({ token })
    },
  })
}
