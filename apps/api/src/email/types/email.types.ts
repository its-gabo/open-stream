import type {
  ResetPasswordEmailProps,
  WelcomeVerifyEmailProps,
} from "@workspace/email-templates"
import type { AppConfig } from "../../config/app.config"
import type { EMAIL_TEMPLATES } from "../constants/email.constants"

/** Outbox payload of an email: rendered by the worker right before it is sent. */
export type SendEmailPayload = {
  recipient: string
  subject: string
} & (
  | {
      template: typeof EMAIL_TEMPLATES.WELCOME_VERIFY
      props: WelcomeVerifyEmailProps
    }
  | {
      template: typeof EMAIL_TEMPLATES.RESET_PASSWORD
      props: ResetPasswordEmailProps
    }
)

export type RenderedEmail = {
  recipient: string
  subject: string
  html: string
  text: string
}

export type EmailModuleDependencies = {
  config: AppConfig
}
