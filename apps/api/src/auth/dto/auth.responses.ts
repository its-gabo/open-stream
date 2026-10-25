import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const AUTH_SUCCESS_CODES = {
  SIGN_UP: "auth.sign_up.success",
  SIGN_IN: "auth.sign_in.success",
  SIGN_OUT: "auth.sign_out.success",
  SESSION: "auth.session.success",
  FORGOT_PASSWORD: "auth.forgot_password.success",
  RESET_PASSWORD: "auth.reset_password.success",
  VERIFY_EMAIL: "auth.verify_email.success",
} as const

export const AUTH_SUCCESS_RESULTS = {
  SIGN_UP: {
    code: AUTH_SUCCESS_CODES.SIGN_UP,
    message: "Please verify your email before signing in.",
  },
  SIGN_IN: {
    code: AUTH_SUCCESS_CODES.SIGN_IN,
    message: "Signed in successfully.",
  },
  SIGN_OUT: {
    code: AUTH_SUCCESS_CODES.SIGN_OUT,
    message: "Signed out successfully.",
  },
  SESSION: { code: AUTH_SUCCESS_CODES.SESSION, message: "Session fetched." },
  FORGOT_PASSWORD: {
    code: AUTH_SUCCESS_CODES.FORGOT_PASSWORD,
    message:
      "If the account exists, a password reset email has been requested.",
  },
  RESET_PASSWORD: {
    code: AUTH_SUCCESS_CODES.RESET_PASSWORD,
    message: "Password reset successfully. Sign in with your new password.",
  },
  VERIFY_EMAIL: {
    code: AUTH_SUCCESS_CODES.VERIFY_EMAIL,
    message: "Your email has been verified. You can now sign in.",
  },
} as const satisfies ApiResultCatalog<typeof AUTH_SUCCESS_CODES>
