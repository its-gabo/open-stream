import { describe, expect, it, mock } from "bun:test"

import { EMAIL_TEMPLATES } from "../constants/email.constants"
import { EmailDeliveryService } from "../services/email-delivery.service"
import { EmailRendererService } from "../services/email-renderer.service"
import {
  DELETION_SCHEDULED_EMAIL,
  ORGANIZATION_EMAILS,
} from "./email-delivery.scenarios"

import type { EmailSenderService } from "../services/email-sender.service"
import type { RenderedEmail, SendEmailPayload } from "../types/email.types"

const RESET_URL = "https://app.openstream.test/reset-password?token=abc"

const RESET_EMAIL: SendEmailPayload = {
  recipient: "ada@example.test",
  subject: "Reset your OpenStream password",
  template: EMAIL_TEMPLATES.RESET_PASSWORD,
  props: {
    email: "ada@example.test",
    name: "Ada",
    resetUrl: RESET_URL,
    expiresInMinutes: 30,
  },
}

function createRecordingSender() {
  const sendEmail = mock(async (_email: RenderedEmail) => undefined)

  return { sendEmail, sender: { sendEmail } as unknown as EmailSenderService }
}

describe("Email delivery", () => {
  it("renders the template into HTML and plain text before sending", async () => {
    const { sendEmail, sender } = createRecordingSender()

    await new EmailDeliveryService(
      new EmailRendererService(),
      sender
    ).deliverEmail(RESET_EMAIL)

    const [sentEmail] = sendEmail.mock.calls[0]!

    expect(sentEmail.recipient).toBe(RESET_EMAIL.recipient)
    expect(sentEmail.subject).toBe(RESET_EMAIL.subject)
    expect(sentEmail.html).toContain(`href="${RESET_URL}"`)
    expect(sentEmail.text).toContain(RESET_URL)
    expect(sentEmail.text).toContain("expire in 30 minutes")
  })

  it("escapes user-controlled values in the HTML", async () => {
    const { sendEmail, sender } = createRecordingSender()

    await new EmailDeliveryService(
      new EmailRendererService(),
      sender
    ).deliverEmail({
      ...RESET_EMAIL,
      props: { ...RESET_EMAIL.props, name: "<script>alert(1)</script>" },
    })

    const [sentEmail] = sendEmail.mock.calls[0]!

    expect(sentEmail.html).not.toContain("<script>alert(1)</script>")
    expect(sentEmail.html).toContain("&lt;script&gt;")
  })

  describe("organization notifications", () => {
    const deliverOrganizationEmail = async (
      props: (typeof ORGANIZATION_EMAILS)[number]
    ) => {
      const { sendEmail, sender } = createRecordingSender()

      await new EmailDeliveryService(
        new EmailRendererService(),
        sender
      ).deliverEmail({
        recipient: props.email,
        subject: "Organization update",
        template: EMAIL_TEMPLATES.ORGANIZATION_NOTIFICATION,
        props,
      })

      return sendEmail.mock.calls[0]![0]
    }

    it.each(ORGANIZATION_EMAILS)("renders the $kind email", async (props) => {
      const sentEmail = await deliverOrganizationEmail(props)

      expect(sentEmail.text).toContain(props.organizationName)
    })

    it("dates the scheduled deletion in UTC", async () => {
      const sentEmail = await deliverOrganizationEmail(DELETION_SCHEDULED_EMAIL)

      expect(sentEmail.text).toContain("October 29, 2026 at 12:00 PM UTC")
    })
  })
})
