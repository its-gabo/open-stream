import {
  ResetPasswordEmail,
  WelcomeVerifyEmail,
  type EmailContent,
} from "@workspace/email-templates"
import { match } from "ts-pattern"
import { EMAIL_TEMPLATES } from "../constants/email.constants"
import type { RenderedEmail, SendEmailPayload } from "../types/email.types"

export class EmailRendererService {
  async renderEmail(payload: SendEmailPayload): Promise<RenderedEmail> {
    const content = this.createEmailContent(payload)
    const [html, text] = await Promise.all([
      content.getHtml(),
      content.getText(),
    ])

    return {
      recipient: payload.recipient,
      subject: payload.subject,
      html,
      text,
    }
  }

  private createEmailContent(payload: SendEmailPayload): EmailContent {
    return match(payload)
      .with(
        { template: EMAIL_TEMPLATES.WELCOME_VERIFY },
        ({ props }) => new WelcomeVerifyEmail(props)
      )
      .with(
        { template: EMAIL_TEMPLATES.RESET_PASSWORD },
        ({ props }) => new ResetPasswordEmail(props)
      )
      .exhaustive()
  }
}
