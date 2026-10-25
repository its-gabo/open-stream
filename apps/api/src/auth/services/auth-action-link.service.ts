import type { AppConfig } from "../../config/app.config"
import { AUTH_ACTION_PATHS } from "../constants/auth.constants"

export class AuthActionLinkService {
  constructor(private readonly config: AppConfig) {}

  buildEmailVerificationUrl(rawToken: string, redirectTo?: string) {
    const searchParams = new URLSearchParams({ token: rawToken })

    if (redirectTo) searchParams.set("redirectTo", redirectTo)

    return this.buildWebAppUrl(AUTH_ACTION_PATHS.VERIFY_EMAIL, searchParams)
  }

  buildPasswordResetUrl(rawToken: string) {
    return this.buildWebAppUrl(
      AUTH_ACTION_PATHS.RESET_PASSWORD,
      new URLSearchParams({ token: rawToken })
    )
  }

  private buildWebAppUrl(path: string, searchParams: URLSearchParams) {
    const url = new URL(path, this.config.WEB_ORIGIN)
    url.search = searchParams.toString()

    return url.toString()
  }
}
