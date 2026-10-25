import { redirect } from "@tanstack/react-router"
import { safeRedirectPathSchema } from "@workspace/shared"

import { AUTH_REDIRECT_PATH } from "./auth.constants"

import type { AuthGuardParams } from "./auth.types"

import { authSessionQueryOptions } from "@/api/queries/auth/useAuthSessionQuery"

/** UX-only guard: the API enforces sessions itself. */
export async function requireAuthenticated({
  queryClient,
  location,
}: AuthGuardParams) {
  const session = await queryClient.fetchQuery(authSessionQueryOptions)

  if (session.authenticated) return { user: session.user }

  throw redirect({
    to: "/sign-in",
    search: {
      redirectTo: safeRedirectPathSchema.safeParse(location.href).data,
    },
  })
}

export async function redirectAuthenticated({
  queryClient,
  location,
}: AuthGuardParams) {
  const session = await queryClient.fetchQuery(authSessionQueryOptions)

  if (!session.authenticated) return

  throw redirect({
    href:
      safeRedirectPathSchema.safeParse(location.search.redirectTo).data ??
      AUTH_REDIRECT_PATH,
  })
}
