import { EMAIL_LOGO_PATH } from "@workspace/email-templates"
import { OUTBOX_MESSAGE_TYPES } from "../outbox/constants/outbox.constants"
import type { OutboxMessageHandlers } from "../outbox/types/outbox.types"
import { EmailDeliveryService } from "./services/email-delivery.service"
import { EmailRendererService } from "./services/email-renderer.service"
import { EmailSenderService } from "./services/email-sender.service"
import type { EmailModuleDependencies } from "./types/email.types"

export function createEmailModule(dependencies: EmailModuleDependencies) {
  const emailSenderService = new EmailSenderService(dependencies.config)
  const emailDeliveryService = new EmailDeliveryService(
    new EmailRendererService({
      logoUrl: new URL(EMAIL_LOGO_PATH, dependencies.config.WEB_ORIGIN).href,
    }),
    emailSenderService
  )

  return {
    emailSenderService,
    emailDeliveryService,
    emailOutboxMessageHandlers: {
      [OUTBOX_MESSAGE_TYPES.SEND_EMAIL]: (payload) =>
        emailDeliveryService.deliverEmail(payload),
    } satisfies Pick<
      OutboxMessageHandlers,
      typeof OUTBOX_MESSAGE_TYPES.SEND_EMAIL
    >,
  }
}
