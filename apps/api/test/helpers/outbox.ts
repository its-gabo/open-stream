import { ORGANIZATION_EMAIL_KINDS } from "@workspace/email-templates"
import { asc } from "drizzle-orm"
import { P, match } from "ts-pattern"

import { outboxMessages } from "../../src/db/schema"
import { EMAIL_TEMPLATES } from "../../src/email/constants/email.constants"
import { OUTBOX_MESSAGE_TYPES } from "../../src/outbox/constants/outbox.constants"

import type { OrganizationNotificationEmailProps } from "@workspace/email-templates"
import type { SendEmailPayload } from "../../src/email/types/email.types"
import type { ProcessVideoPayload } from "../../src/libraries/types/libraries.types"
import type { StorageCleanupPayload } from "../../src/storage/types/storage.types"
import type { DeliverWebhookPayload } from "../../src/webhooks/types/webhooks.types"
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
      .with(
        {
          template: EMAIL_TEMPLATES.ORGANIZATION_NOTIFICATION,
          props: { kind: ORGANIZATION_EMAIL_KINDS.INVITATION },
        },
        ({ props }) => props.invitationUrl
      )
      .with(
        {
          template: EMAIL_TEMPLATES.ORGANIZATION_NOTIFICATION,
          props: { kind: ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED },
        },
        ({ props }) => props.cancelUrl
      )
      .otherwise(() => {
        throw new Error(`The "${email.subject}" email has no action link`)
      })
  )

/** The raw token from the link in the newest email sent to `recipient`. */
export async function latestEmailToken(testApp: TestApp, recipient: string) {
  const email = (await findPublishedEmails(testApp, recipient)).at(-1)

  if (!email) throw new Error(`No email was published to ${recipient}`)

  const token = emailActionUrl(email).searchParams.get("token")

  if (!token) throw new Error("The email link has no token")

  return token
}

function requireSearchParam(url: string, name: string) {
  const value = new URL(url).searchParams.get(name)

  if (!value) throw new Error(`The email link has no ${name}`)

  return value
}

/** Organization notifications published to `recipient`, oldest first. */
export async function findOrganizationEmails(
  testApp: TestApp,
  recipient: string
): Promise<OrganizationNotificationEmailProps[]> {
  const emails = await findPublishedEmails(testApp, recipient)

  return emails.flatMap((email) =>
    match(email)
      .with(
        { template: EMAIL_TEMPLATES.ORGANIZATION_NOTIFICATION },
        ({ props }) => [props]
      )
      .otherwise(() => [])
  )
}

/** The cancel and delete tokens from the newest deletion email sent to `recipient`. */
export async function latestDeletionTokens(
  testApp: TestApp,
  recipient: string
) {
  const scheduledEmail = (await findOrganizationEmails(testApp, recipient))
    .filter(
      (email) => email.kind === ORGANIZATION_EMAIL_KINDS.DELETION_SCHEDULED
    )
    .at(-1)

  return match(scheduledEmail)
    .with({ cancelUrl: P.string, deleteUrl: P.string }, (email) => ({
      cancelToken: requireSearchParam(email.cancelUrl, "token"),
      deleteToken: requireSearchParam(email.deleteUrl, "token"),
    }))
    .otherwise(() => {
      throw new Error(`No deletion email was published to ${recipient}`)
    })
}

/** The invitation id from the link in the newest invitation sent to `recipient`. */
export async function latestInvitationId(testApp: TestApp, recipient: string) {
  const invitationEmail = (await findOrganizationEmails(testApp, recipient))
    .filter((email) => email.kind === ORGANIZATION_EMAIL_KINDS.INVITATION)
    .at(-1)

  return match(invitationEmail)
    .with({ invitationUrl: P.string }, ({ invitationUrl }) =>
      requireSearchParam(invitationUrl, "invitationId")
    )
    .otherwise(() => {
      throw new Error(`No invitation was published to ${recipient}`)
    })
}

/** Processing requests published to the outbox, oldest first. */
export async function findVideoProcessingRequests(testApp: TestApp) {
  const messages = await testApp.appModule.db
    .select()
    .from(outboxMessages)
    .orderBy(asc(outboxMessages.createdAt))

  return messages
    .filter((message) => message.type === OUTBOX_MESSAGE_TYPES.PROCESS_VIDEO)
    .map((message) => message.payload as ProcessVideoPayload)
}

/** Webhook delivery requests published to the outbox, oldest first. */
export async function findWebhookDeliveryRequests(testApp: TestApp) {
  const messages = await testApp.appModule.db
    .select()
    .from(outboxMessages)
    .orderBy(asc(outboxMessages.createdAt))

  return messages
    .filter((message) => message.type === OUTBOX_MESSAGE_TYPES.DELIVER_WEBHOOK)
    .map((message) => message.payload as DeliverWebhookPayload)
}

/** Runs what the worker runs for every storage cleanup published so far; returns the errors of those that failed. */
export async function runStorageCleanups(testApp: TestApp) {
  const messages = await testApp.appModule.db
    .select()
    .from(outboxMessages)
    .orderBy(asc(outboxMessages.createdAt))
  const errors: unknown[] = []

  for (const message of messages) {
    if (message.type !== OUTBOX_MESSAGE_TYPES.CLEAN_UP_STORAGE) continue

    await testApp.appModule.storageCleanupService
      .runCleanup(message.payload as StorageCleanupPayload)
      .catch((error: unknown) => errors.push(error))
  }

  return errors
}
