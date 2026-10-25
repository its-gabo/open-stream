import nodemailer, { type Transporter } from "nodemailer"
import type { AppConfig } from "../../config/app.config"
import type { RenderedEmail } from "../types/email.types"

export class EmailSenderService {
  private readonly transport: Transporter

  constructor(private readonly config: AppConfig) {
    this.transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: config.SMTP_USER
        ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
        : undefined,
    })
  }

  async sendEmail(email: RenderedEmail) {
    await this.transport.sendMail({
      from: this.config.EMAIL_FROM,
      to: email.recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
  }

  close() {
    this.transport.close()
  }
}
