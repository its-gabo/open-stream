import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import type { AppConfig } from "../../config/app.config"
import { AUTH_SESSION_COOKIE } from "../constants/auth.constants"

export class AuthCookieService {
  constructor(private readonly config: AppConfig) {}

  readSessionToken(c: Context) {
    return getCookie(c, this.config.AUTH_COOKIE_NAME) ?? null
  }

  setSessionCookie(c: Context, sessionToken: string, expiresAt: Date) {
    setCookie(c, this.config.AUTH_COOKIE_NAME, sessionToken, {
      ...this.getCookieOptions(),
      expires: expiresAt,
    })
  }

  clearSessionCookie(c: Context) {
    deleteCookie(c, this.config.AUTH_COOKIE_NAME, this.getCookieOptions())
  }

  private getCookieOptions() {
    return {
      httpOnly: AUTH_SESSION_COOKIE.HTTP_ONLY,
      secure: this.config.AUTH_COOKIE_SECURE,
      sameSite: this.config.AUTH_COOKIE_SAME_SITE,
      path: AUTH_SESSION_COOKIE.PATH,
    } as const
  }
}
