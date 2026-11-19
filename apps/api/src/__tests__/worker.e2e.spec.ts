import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { RedisClient } from "bun"
import { eq } from "drizzle-orm"

import { createLibraryFactory } from "../../test/factory/library.factory"
import { createOrganizationFactory } from "../../test/factory/organization.factory"
import { createUserFactory } from "../../test/factory/user.factory"
import { createApiClient, signInAsUser } from "../../test/helpers/api-client"
import { startFileServer } from "../../test/helpers/file-server"
import { endDeletionGracePeriods } from "../../test/helpers/organization-records"
import { startSmtpServer } from "../../test/helpers/smtp-server"
import {
  TEST_REDIS_URL,
  createTestApp,
  createTestConfig,
} from "../../test/helpers/test-app"
import { createTusClient } from "../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../test/helpers/video-files"
import { startWebhookReceiver } from "../../test/helpers/webhook-receiver"
import { organizations, storageCleanups, webhookDeliveries } from "../db/schema"
import { VALID_DELETION_CONFIRMATION } from "../organizations/__tests__/organization-deletion.scenarios"
import { createWorkerModule } from "../worker.module"

import type { UserCredentials } from "../../test/factory/user.factory"
import type { ApiClient } from "../../test/helpers/api-client"
import type { TestApp } from "../../test/helpers/test-app"
import type { MediaToolkit } from "../media/types/media.types"

const WAIT_TIMEOUT_MS = 15_000

const failingMediaToolkit: MediaToolkit = {
  probe: async () => ({
    durationSeconds: 3,
    width: 640,
    height: 360,
    videoCodec: "h264",
    audioCodec: "aac",
    frameRate: 24,
  }),
  transcodeToHls: async () => {
    throw new Error("ffmpeg crashed")
  },
  captureImage: async () => {},
  convertImage: async () => {},
}

/** Polls until `read` returns something truthy, as the worker runs on its own schedule. */
async function waitFor<T>(
  read: () => Promise<T> | T,
  what: string
): Promise<Exclude<T, false | 0 | "" | null | undefined>> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS

  while (Date.now() < deadline) {
    const value = await read()

    if (value) return value as Exclude<T, false | 0 | "" | null | undefined>

    await Bun.sleep(25)
  }

  throw new Error(`Timed out waiting for ${what}`)
}

/**
 * The background worker as `src/worker.ts` runs it: the outbox relayed to
 * BullMQ in Redis, every queue consumed, and organizations swept, next to
 * the API under test. Needs Redis (`TEST_REDIS_URL`).
 */
describe("Worker (e2e)", () => {
  let testApp: TestApp
  let worker: ReturnType<typeof createWorkerModule>
  let smtpServer: ReturnType<typeof startSmtpServer>
  let webhookReceiver: ReturnType<typeof startWebhookReceiver>
  let fileServer: ReturnType<typeof startFileServer>
  let fileRequestCount: number
  let owner: UserCredentials
  let ownerClient: ApiClient
  let libraryPath: string

  beforeEach(async () => {
    const redis = new RedisClient(TEST_REDIS_URL)

    await redis.send("FLUSHDB", [])
    redis.close()

    smtpServer = startSmtpServer()
    webhookReceiver = startWebhookReceiver()
    fileRequestCount = 0
    fileServer = startFileServer({
      "/clip.mp4": () => {
        fileRequestCount += 1

        return fileRequestCount === 1
          ? new Response(null, { status: 503 })
          : new Response(createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024))
      },
    })

    const config = {
      REDIS_URL: TEST_REDIS_URL,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: String(smtpServer.port),
      OUTBOX_POLL_INTERVAL_MS: "20",
      OUTBOX_RETRY_DELAY_MS: "20",
      WEBHOOK_RETRY_DELAY_MS: "20",
      VIDEO_PROCESSING_MAX_ATTEMPTS: "2",
      VIDEO_PROCESSING_RETRY_DELAY_MS: "20",
      VIDEO_IMPORT_MAX_ATTEMPTS: "2",
      VIDEO_IMPORT_RETRY_DELAY_MS: "20",
      ORGANIZATION_SWEEP_INTERVAL_MS: "50",
    }

    testApp = await createTestApp(config, { mediaToolkit: failingMediaToolkit })
    worker = createWorkerModule(createTestConfig(config), {
      objectStorage: testApp.objectStorage,
      mediaToolkit: failingMediaToolkit,
    })
    worker.start()

    owner = await createUserFactory(testApp).create()
    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .create({ name: "Acme", slug: "acme" })
    const library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create({ name: "Marketing" })
    libraryPath = `/organizations/acme/libraries/${library.id}`
    ownerClient = await signInAsUser(testApp, owner)
  })

  afterEach(async () => {
    await worker.close()
    await testApp.close()
    smtpServer.stop()
    webhookReceiver.stop()
    fileServer.stop()
  })

  const emailsTo = (recipient: string) =>
    smtpServer.received.filter(({ recipients }) =>
      recipients.includes(recipient)
    )

  const uploadVideo = async () => {
    const { video } = (
      await (
        await ownerClient.post(`${libraryPath}/videos`, { title: "Clip" })
      ).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
    const response = await createTusClient(
      ownerClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "clip.mp4", bytes.byteLength)

    expect(response.status).toBe(204)

    return video.id as string
  }

  it("renders and sends every kind of email the app queues", async () => {
    await ownerClient.post("/organizations/acme/team/invitations", {
      email: "invitee@example.com",
    })
    await createApiClient(testApp).post("/auth/forgot-password", {
      email: owner.email,
    })

    const emailContaining = (recipient: string, text: string) =>
      waitFor(
        () => emailsTo(recipient).find(({ data }) => data.includes(text)),
        `an email to ${recipient} with "${text}"`
      )

    const welcome = await emailContaining(owner.email, "verify-email")
    const invitation = await emailContaining("invitee@example.com", "Acme")
    const reset = await emailContaining(owner.email, "reset-password")

    expect([welcome, invitation, reset].map(({ data }) => data)).toEqual([
      expect.stringContaining("text/html"),
      expect.stringContaining("text/html"),
      expect.stringContaining("text/html"),
    ])
  })

  it("retries a webhook through its queue until the endpoint answers", async () => {
    webhookReceiver.status = 500
    await ownerClient.put(`${libraryPath}/webhook`, {
      url: webhookReceiver.url,
    })
    await ownerClient.post(`${libraryPath}/webhook/test`)

    await waitFor(() => webhookReceiver.received.length > 0, "a first attempt")
    webhookReceiver.status = 200
    const delivery = await waitFor(async () => {
      const [row] = await testApp.appModule.db.select().from(webhookDeliveries)

      return row?.status === "succeeded" && row
    }, "the delivery to succeed")

    expect(delivery.attempts).toBe(2)
    expect(
      new Set(
        webhookReceiver.received.map(({ headers }) => headers["webhook-id"])
      ).size
    ).toBe(1)
  })

  it("retries processing a video and fails it on the last attempt", async () => {
    const videoId = await uploadVideo()

    const video = await waitFor(async () => {
      const response = await ownerClient.get(`${libraryPath}/videos/${videoId}`)
      const { video } = (await response.json()).data

      return video.processingStatus === "failed" && video
    }, "processing to fail")

    expect(video.processingFailureReason).toBe("transcoding_failed")
  })

  it("imports a video through its queue, retrying a busy server, then processes it", async () => {
    const { video } = (
      await (
        await ownerClient.post(`${libraryPath}/videos`, { title: "Clip" })
      ).json()
    ).data

    await ownerClient.post(`${libraryPath}/videos/${video.id}/import`, {
      url: fileServer.url("/clip.mp4"),
    })

    const processed = await waitFor(async () => {
      const response = await ownerClient.get(
        `${libraryPath}/videos/${video.id}`
      )
      const { video: current } = (await response.json()).data

      return current.processingStatus === "failed" && current
    }, "the import to finish and processing to run")

    expect(processed).toEqual(
      expect.objectContaining({ status: "uploaded", sizeBytes: 1024 })
    )
    expect(fileRequestCount).toBe(2)
  })

  it("removes a deleted video's file from storage", async () => {
    const videoId = await uploadVideo()
    const location = testApp.appModule.defaultStorageLocation

    await ownerClient.delete(`${libraryPath}/videos/${videoId}`)

    await waitFor(
      async () =>
        testApp.objectStorage.listObjectKeys(location).length === 0 &&
        (await testApp.appModule.db.select().from(storageCleanups)).length ===
          0,
      "the files to be removed"
    )
  })

  it("deletes an organization once its grace period ends", async () => {
    await ownerClient.post(
      "/organizations/acme/deletion",
      VALID_DELETION_CONFIRMATION
    )
    await endDeletionGracePeriods(testApp)

    await waitFor(
      async () =>
        (
          await testApp.appModule.db
            .select()
            .from(organizations)
            .where(eq(organizations.slug, "acme"))
        ).length === 0,
      "the organization to be deleted"
    )
    const deletedEmail = await waitFor(
      () => emailsTo(owner.email).find(({ data }) => data.includes("deleted")),
      "the deletion email"
    )

    expect(deletedEmail).toBeDefined()
  })
})
