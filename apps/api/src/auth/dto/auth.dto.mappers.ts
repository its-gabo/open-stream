import type { AuthUserSession } from "../types/auth.types"
import type { AuthSessionDto, AuthUserDto } from "./auth.schemas"

export const toAuthUserDto = (session: AuthUserSession): AuthUserDto => ({
  id: session.userId,
  email: session.email,
  name: session.name,
  emailVerified: session.emailVerified,
})

export const toAuthSessionDto = (
  session: AuthUserSession | null
): AuthSessionDto => {
  if (!session) return { authenticated: false }

  return { authenticated: true, user: toAuthUserDto(session) }
}
