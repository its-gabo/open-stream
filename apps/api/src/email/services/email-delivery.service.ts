import type { SendEmailPayload } from "../types/email.types"
import type { EmailRendererService } from "./email-renderer.service"
import type { EmailSenderService } from "./email-sender.service"

export class EmailDeliveryService {
  constructor(
    private readonly emailRendererService: EmailRendererService,
    private readonly emailSenderService: EmailSenderService
  ) {}

  async deliverEmail(payload: SendEmailPayload) {
    await this.emailSenderService.sendEmail(
      await this.emailRendererService.renderEmail(payload)
    )
  }
}
