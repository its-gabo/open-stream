import { asc } from "drizzle-orm"
import { match } from "ts-pattern"

import { outboxMessages } from "../../src/db/schema"
import { EMAIL_TEMPLATES } from "../../src/email/constants/email.constants"
import { OUTBOX_MESSAGE_TYPES } from "../../src/outbox/constants/outbox.constants"

import type { SendEmailPayload } from "../../src/email/types/email.types"
import type { TestApp } from "./test-app"

/** Emails published to the outbox, oldest first; the worker is not running in tests. */
export async function findPublishedEmails(
  testApp: TestApp,
  recipient?: string
) {
  const messages = await testApp.appModule.db
    .select()
    .from(outboxMessages)
    .orderBy(asc(outboxMessages.createdAt))

  return messages
    .filter((message) => message.type === OUTBOX_MESSAGE_TYPES.SEND_EMAIL)
    .map((message) => message.payload as SendEmailPayload)
    .filter((email) => !recipient || email.recipient === recipient)
}

export const emailActionUrl = (email: SendEmailPayload) =>
  new URL(
    match(email)
      .with(
        { template: EMAIL_TEMPLATES.WELCOME_VERIFY },
        ({ props }) => props.verificationUrl
      )
      .with(
        { template: EMAIL_TEMPLATES.RESET_PASSWORD },
        ({ props }) => props.resetUrl
      )
      .exhaustive()
  )

/** The raw token from the link in the newest email sent to `recipient`. */
export async function latestEmailToken(testApp: TestApp, recipient: string) {
  const email = (await findPublishedEmails(testApp, recipient)).at(-1)

  if (!email) throw new Error(`No email was published to ${recipient}`)

  const token = emailActionUrl(email).searchParams.get("token")

  if (!token) throw new Error("The email link has no token")

  return token
}
