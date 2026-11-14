import {
  OrganizationNotificationEmail,
  ResetPasswordEmail,
  WelcomeVerifyEmail,
  type EmailBrand,
  type EmailContent,
} from "@workspace/email-templates"
import { match } from "ts-pattern"
import { EMAIL_TEMPLATES } from "../constants/email.constants"
import type { RenderedEmail, SendEmailPayload } from "../types/email.types"

export class EmailRendererService {
  constructor(private readonly brand: EmailBrand) {}

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
        ({ props }) => new WelcomeVerifyEmail(props, this.brand)
      )
      .with(
        { template: EMAIL_TEMPLATES.RESET_PASSWORD },
        ({ props }) => new ResetPasswordEmail(props, this.brand)
      )
      .with(
        { template: EMAIL_TEMPLATES.ORGANIZATION_NOTIFICATION },
        ({ props }) => new OrganizationNotificationEmail(props, this.brand)
      )
      .exhaustive()
  }
}
