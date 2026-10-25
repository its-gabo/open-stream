import type { AppConfig } from "../../config/app.config"
import { EMAIL_TEMPLATES } from "../../email/constants/email.constants"
import type { SendEmailPayload } from "../../email/types/email.types"
import { AUTH_EMAIL_SUBJECTS } from "../constants/auth-email.constants"
import type {
  AuthResetPasswordEmailPayload,
  AuthWelcomeVerifyEmailPayload,
} from "../types/auth.types"

export class AuthEmailService {
  constructor(private readonly config: AppConfig) {}

  composeWelcomeVerifyEmail(
    payload: AuthWelcomeVerifyEmailPayload
  ): SendEmailPayload {
    return {
      recipient: payload.email,
      subject: AUTH_EMAIL_SUBJECTS.WELCOME_VERIFY,
      template: EMAIL_TEMPLATES.WELCOME_VERIFY,
      props: {
        ...payload,
        expiresInHours: this.config.AUTH_EMAIL_VERIFICATION_TTL_HOURS,
      },
    }
  }

  composeResetPasswordEmail(
    payload: AuthResetPasswordEmailPayload
  ): SendEmailPayload {
    return {
      recipient: payload.email,
      subject: AUTH_EMAIL_SUBJECTS.RESET_PASSWORD,
      template: EMAIL_TEMPLATES.RESET_PASSWORD,
      props: {
        ...payload,
        expiresInMinutes: this.config.AUTH_PASSWORD_RESET_TTL_MINUTES,
      },
    }
  }
}
