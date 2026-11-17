import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import * as dns from "node:dns"
import { eq } from "drizzle-orm"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import {
  HAS_FFMPEG,
  createTestMediaFile,
} from "../../../test/helpers/media-files"
import {
  findVideoProcessingRequests,
  findWebhookDeliveryRequests,
} from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { startWebhookReceiver } from "../../../test/helpers/webhook-receiver"
import { DAY_MS } from "../../common/time/time.constants"
import { libraryWebhooks, webhookDeliveries } from "../../db/schema"
import { signWebhook } from "../utils/webhook-signature.utils"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { LibraryDto } from "../../libraries/dto/libraries.schemas"
import type { MediaToolkit } from "../../media/types/media.types"
import type {
  WebhookDeliveryDto,
  WebhookEventDto,
} from "../dto/webhooks.schemas"

const mp4Placeholder = () => createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)

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
}

describe("Library webhooks (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let library: LibraryDto
  let libraryPath: string
  let webhookPath: string
  let receiver: ReturnType<typeof startWebhookReceiver>

  const setUp = async (app: TestApp) => {
    testApp = app
    owner = await createUserFactory(testApp).create()
    const member = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create({ name: "Marketing" })
    libraryPath = `/organizations/acme/libraries/${library.id}`
    webhookPath = `${libraryPath}/webhook`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  }

  beforeEach(() => {
    receiver = startWebhookReceiver()
  })

  afterEach(async () => {
    receiver.stop()
    await testApp.close()
  })

  const saveWebhook = async (url = receiver.url) => {
    const response = await ownerClient.put(webhookPath, { url })

    expect(response.status).toBe(200)

    return (await response.json()).data as {
      signingSecret: string | null
      webhook: { url: string; signingSecretHint: string }
    }
  }

  const uploadVideo = async (bytes: Uint8Array<ArrayBuffer>) => {
    const { video } = (
      await (
        await memberClient.post(`${libraryPath}/videos`, { title: "Clip" })
      ).json()
    ).data
    const response = await createTusClient(
      memberClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "clip.mp4", bytes.byteLength)

    expect(response.status).toBe(204)

    return video.id as string
  }

  const processVideo = async (videoId: string, isFinalAttempt = true) => {
    const request = (await findVideoProcessingRequests(testApp))
      .filter((each) => each.videoId === videoId)
      .at(-1)

    if (!request) throw new Error(`No processing request for ${videoId}`)

    await testApp.appModule.videoProcessingService.processVideo(request, {
      isFinalAttempt,
    })
  }

  /** Runs what the worker runs for every delivery request published so far, oldest first. */
  const deliverQueued = async (isFinalAttempt = true) => {
    for (const request of await findWebhookDeliveryRequests(testApp)) {
      await testApp.appModule.webhookDeliveryService.deliverWebhook(request, {
        isFinalAttempt,
      })
    }
  }

  const listDeliveries = async (
    query = ""
  ): Promise<{
    deliveries: WebhookDeliveryDto[]
    pagination: { totalItems: number }
  }> =>
    (await (await ownerClient.get(`${webhookPath}/deliveries${query}`)).json())
      .data

  const receivedEvents = () =>
    receiver.received.map(({ body }) => JSON.parse(body) as WebhookEventDto)

  describe("settings", () => {
    beforeEach(async () => setUp(await createTestApp()))

    it("shows the signing secret only when the webhook is created", async () => {
      const created = await saveWebhook()
      const moved = await saveWebhook("https://hooks.example.com/openstream")
      const read = (await (await ownerClient.get(webhookPath)).json()).data
      const [row] = await testApp.appModule.db
        .select()
        .from(libraryWebhooks)
        .where(eq(libraryWebhooks.libraryId, library.id))

      expect(created.signingSecret).toStartWith("whsec_")
      expect(created.webhook.signingSecretHint).toBe(
        created.signingSecret!.slice(-4)
      )
      expect(moved).toEqual({
        signingSecret: null,
        webhook: expect.objectContaining({
          url: "https://hooks.example.com/openstream",
          signingSecretHint: created.webhook.signingSecretHint,
        }),
      })
      expect(read.webhook).toEqual(moved.webhook)
      expect(JSON.stringify(read)).not.toContain(created.signingSecret)
      expect(JSON.stringify(row)).not.toContain(created.signingSecret)
    })

    it("rolls the signing secret", async () => {
      const created = await saveWebhook()

      const response = await ownerClient.post(`${webhookPath}/roll-secret`)
      const rolled = (await response.json()).data

      expect(response.status).toBe(200)
      expect(rolled.signingSecret).toStartWith("whsec_")
      expect(rolled.signingSecret).not.toBe(created.signingSecret)
      expect(rolled.webhook.signingSecretHint).toBe(
        rolled.signingSecret.slice(-4)
      )
    })

    it("reads as null without a webhook, and refuses changes to a missing one", async () => {
      const read = await ownerClient.get(webhookPath)
      const responses = await Promise.all([
        ownerClient.delete(webhookPath),
        ownerClient.post(`${webhookPath}/roll-secret`),
        ownerClient.post(`${webhookPath}/test`),
      ])

      expect((await read.json()).data.webhook).toBeNull()
      expect(responses.map(({ status }) => status)).toEqual([404, 404, 404])
    })

    it.each([
      { description: "a non-HTTP URL", url: "ftp://hooks.example.com" },
      { description: "a URL with credentials", url: "https://a:b@example.com" },
      { description: "no URL", url: "" },
    ])("rejects $description", async ({ url }) => {
      const response = await ownerClient.put(webhookPath, { url })

      expect(response.status).toBe(422)
    })

    it("keeps the webhook away from members", async () => {
      await saveWebhook()

      const responses = await Promise.all([
        memberClient.get(webhookPath),
        memberClient.put(webhookPath, { url: "https://example.com" }),
        memberClient.delete(webhookPath),
        memberClient.post(`${webhookPath}/roll-secret`),
        memberClient.post(`${webhookPath}/test`),
        memberClient.get(`${webhookPath}/deliveries`),
      ])

      expect(responses.map(({ status }) => status)).toEqual([
        403, 403, 403, 403, 403, 403,
      ])
    })

    it("forgets deliveries when the webhook is removed", async () => {
      await saveWebhook()
      await ownerClient.post(`${webhookPath}/test`)
      const [delivery] = (await listDeliveries()).deliveries

      const removed = await ownerClient.delete(webhookPath)
      const resend = await ownerClient.post(
        `${webhookPath}/deliveries/${delivery!.id}/resend`
      )

      expect(removed.status).toBe(200)
      expect((await listDeliveries()).deliveries).toEqual([])
      expect(resend.status).toBe(404)
    })
  })

  describe("in production", () => {
    beforeEach(async () =>
      setUp(await createTestApp({ WEBHOOK_ALLOW_PRIVATE_URLS: "false" }))
    )

    it.each([
      "http://hooks.example.com/",
      "https://localhost/hooks",
      "https://10.0.0.8/hooks",
      "https://[::1]/hooks",
      "https://metadata.internal/",
      "https://localhost./hooks",
      "https://240.0.0.1/hooks",
      "https://198.18.0.1/hooks",
      "https://[64:ff9b::a9fe:a9fe]/latest",
      "https://[::10.0.0.1]/hooks",
      "https://[2002:a9fe:a9fe::1]/latest",
      "https://[fe80::1]/hooks",
    ])("refuses %s", async (url) => {
      const response = await ownerClient.put(webhookPath, { url })

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe(
        "library.webhook.url_not_allowed"
      )
    })

    it("does not deliver to a host that resolves to a private address", async () => {
      const resolveHost = dns.lookup
      const lookup = spyOn(dns, "lookup").mockImplementation(((
        hostname: string,
        options: dns.LookupOptions,
        callback: (...args: unknown[]) => void
      ) =>
        hostname === "hooks.example.com"
          ? callback(null, [{ address: "169.254.169.254", family: 4 }])
          : resolveHost(hostname, options, callback)) as typeof dns.lookup)

      try {
        await saveWebhook("https://hooks.example.com/openstream")
        await ownerClient.post(`${webhookPath}/test`)
        await deliverQueued()

        expect(lookup).toHaveBeenCalledWith(
          "hooks.example.com",
          expect.anything(),
          expect.any(Function)
        )
      } finally {
        lookup.mockRestore()
      }

      expect((await listDeliveries()).deliveries[0]).toEqual(
        expect.objectContaining({
          status: "failed",
          responseStatus: null,
          lastError: "The host resolves to a private address",
        })
      )
    })
  })

  describe("deliveries", () => {
    beforeEach(async () => setUp(await createTestApp()))

    it("sends nothing while the library has no webhook", async () => {
      await uploadVideo(mp4Placeholder())

      expect(await findWebhookDeliveryRequests(testApp)).toEqual([])
    })

    it("signs each event the Standard Webhooks way", async () => {
      const { signingSecret } = await saveWebhook()
      const videoId = await uploadVideo(mp4Placeholder())

      await deliverQueued()
      const request = receiver.received.find(
        ({ body }) => JSON.parse(body).type === "video.processing.queued"
      )
      const event = JSON.parse(request!.body)

      expect(request!.headers).toEqual(
        expect.objectContaining({
          "content-type": "application/json",
          "webhook-id": event.id,
          "webhook-timestamp": expect.stringMatching(/^\d+$/),
        })
      )
      expect(request!.headers["webhook-signature"]).toBe(
        signWebhook(signingSecret!, {
          id: event.id,
          timestamp: Number(request!.headers["webhook-timestamp"]),
          body: request!.body,
        })
      )
      expect(event).toEqual({
        id: expect.any(String),
        type: "video.processing.queued",
        timestamp: expect.any(String),
        data: {
          videoId,
          libraryId: library.id,
          title: "Clip",
          uploadStatus: "uploaded",
          uploadFailureReason: null,
          processingStatus: "pending",
          processingFailureReason: null,
          durationSeconds: null,
          width: null,
          height: null,
          renditions: [],
          processedAt: null,
        },
      })
      expect((await listDeliveries()).deliveries).toContainEqual(
        expect.objectContaining({
          id: event.id,
          eventType: "video.processing.queued",
          status: "succeeded",
          attempts: 1,
          responseStatus: 200,
          lastError: null,
          payload: event,
        })
      )
    })

    it("retries a failed attempt and gives up on the last one", async () => {
      await saveWebhook()
      receiver.status = 500
      await ownerClient.post(`${webhookPath}/test`)

      await expect(deliverQueued(false)).rejects.toThrow(
        "The endpoint answered 500"
      )
      const afterRetryableFailure = (await listDeliveries()).deliveries[0]
      await expect(deliverQueued(true)).rejects.toThrow()

      expect(afterRetryableFailure).toEqual(
        expect.objectContaining({
          status: "pending",
          attempts: 1,
          responseStatus: 500,
          lastError: "The endpoint answered 500",
        })
      )
      expect((await listDeliveries()).deliveries[0]).toEqual(
        expect.objectContaining({ status: "failed", attempts: 2 })
      )
    })

    it("removes finished deliveries past their retention and keeps pending ones", async () => {
      await saveWebhook()
      await ownerClient.post(`${webhookPath}/test`)
      await deliverQueued()
      await ownerClient.post(`${webhookPath}/test`)
      await testApp.appModule.db
        .update(webhookDeliveries)
        .set({ createdAt: new Date(Date.now() - 31 * DAY_MS) })

      const deletedCount =
        await testApp.appModule.webhookDeliveryService.deleteExpiredDeliveries()

      expect(deletedCount).toBe(1)
      expect(
        (await listDeliveries()).deliveries.map(({ status }) => status)
      ).toEqual(["pending"])
    })

    it("does not follow redirects", async () => {
      await saveWebhook()
      receiver.status = 302
      await ownerClient.post(`${webhookPath}/test`)

      await expect(deliverQueued()).rejects.toThrow()

      expect(receiver.received).toHaveLength(1)
      expect((await listDeliveries()).deliveries[0]).toEqual(
        expect.objectContaining({ status: "failed", responseStatus: 302 })
      )
    })

    it("resends a finished delivery unchanged", async () => {
      await saveWebhook()
      receiver.status = 503
      await ownerClient.post(`${webhookPath}/test`)
      await expect(deliverQueued()).rejects.toThrow()
      const [failed] = (await listDeliveries()).deliveries

      receiver.status = 204
      const resend = await ownerClient.post(
        `${webhookPath}/deliveries/${failed!.id}/resend`
      )
      const resendWhilePending = await ownerClient.post(
        `${webhookPath}/deliveries/${failed!.id}/resend`
      )
      await deliverQueued()

      expect(resend.status).toBe(202)
      expect(resendWhilePending.status).toBe(409)
      expect(receiver.received.map(({ body }) => body)).toEqual([
        receiver.received[0]!.body,
        receiver.received[0]!.body,
      ])
      expect((await listDeliveries()).deliveries[0]).toEqual(
        expect.objectContaining({
          status: "succeeded",
          attempts: 2,
          responseStatus: 204,
        })
      )
    })

    it("pages and filters deliveries, newest first", async () => {
      await saveWebhook()
      for (let index = 0; index < 3; index += 1) {
        await ownerClient.post(`${webhookPath}/test`)
      }
      const all = await listDeliveries()

      const firstPage = await listDeliveries("?pageSize=2")
      const secondPage = await listDeliveries("?pageSize=2&page=2")
      const failed = await listDeliveries("?status=failed")

      expect(firstPage.deliveries.map(({ id }) => id)).toEqual(
        all.deliveries.slice(0, 2).map(({ id }) => id)
      )
      expect(secondPage.deliveries).toHaveLength(1)
      expect(firstPage.pagination.totalItems).toBe(3)
      expect(failed.deliveries).toEqual([])
      expect(
        all.deliveries.map(({ eventType, payload }) => ({
          eventType,
          data: payload.data,
        }))
      ).toEqual(
        Array(3).fill({
          eventType: "webhook.test",
          data: { libraryId: library.id },
        })
      )
    })
  })

  describe("video events", () => {
    beforeEach(async () => setUp(await createTestApp()))

    it("announces a video's creation, renaming and deletion", async () => {
      await saveWebhook()
      const { video } = (
        await (
          await memberClient.post(`${libraryPath}/videos`, { title: "Draft" })
        ).json()
      ).data

      await memberClient.patch(`${libraryPath}/videos/${video.id}`, {
        title: "Final",
      })
      await memberClient.delete(`${libraryPath}/videos/${video.id}`)
      await deliverQueued()

      expect(
        receivedEvents().map(({ type, data }) => ({
          type,
          title: "title" in data && data.title,
        }))
      ).toEqual([
        { type: "video.created", title: "Draft" },
        { type: "video.updated", title: "Final" },
        { type: "video.deleted", title: "Final" },
      ])
    })

    it("announces an uploaded file and a rejected one", async () => {
      await saveWebhook()
      await uploadVideo(mp4Placeholder())
      const { video } = (
        await (
          await memberClient.post(`${libraryPath}/videos`, { title: "Image" })
        ).json()
      ).data
      const rejected = await createTusClient(
        memberClient,
        `${libraryPath}/videos/${video.id}`
      ).upload(createFileBytes(VIDEO_FILE_HEADERS.PNG, 1024), "image.mp4", 1024)

      await deliverQueued()
      const types = receivedEvents().map(({ type }) => type)

      expect(rejected.status).toBe(415)
      expect(types).toContain("video.uploaded")
      expect(receivedEvents().at(-1)).toEqual(
        expect.objectContaining({
          type: "video.upload_failed",
          data: expect.objectContaining({
            videoId: video.id,
            uploadStatus: "failed",
            uploadFailureReason: "invalid_file_type",
          }),
        })
      )
    })
  })

  describe("processing events", () => {
    it("announces the start once and the failure on the last attempt", async () => {
      await setUp(
        await createTestApp({}, { mediaToolkit: failingMediaToolkit })
      )
      await saveWebhook()
      const videoId = await uploadVideo(mp4Placeholder())

      await expect(processVideo(videoId, false)).rejects.toThrow()
      await expect(processVideo(videoId, true)).rejects.toThrow()
      await deliverQueued()

      expect(
        receivedEvents().map(({ type, data }) => ({
          type,
          processingStatus: "processingStatus" in data && data.processingStatus,
        }))
      ).toEqual([
        { type: "video.created", processingStatus: null },
        { type: "video.uploaded", processingStatus: "pending" },
        { type: "video.processing.queued", processingStatus: "pending" },
        { type: "video.processing.started", processingStatus: "processing" },
        { type: "video.processing.failed", processingStatus: "failed" },
      ])
      expect(receivedEvents().at(-1)!.data).toEqual(
        expect.objectContaining({
          processingFailureReason: "transcoding_failed",
        })
      )
    })

    it("announces a requested reprocessing", async () => {
      await setUp(
        await createTestApp({}, { mediaToolkit: failingMediaToolkit })
      )
      const videoId = await uploadVideo(mp4Placeholder())
      await expect(processVideo(videoId)).rejects.toThrow()
      await saveWebhook()

      await memberClient.post(`${libraryPath}/videos/${videoId}/reprocess`)
      await deliverQueued()

      expect(receivedEvents().map(({ type }) => type)).toEqual([
        "video.processing.queued",
      ])
    })

    it.skipIf(!HAS_FFMPEG)(
      "announces a ready video with its renditions, as its status reads",
      async () => {
        await setUp(await createTestApp())
        await saveWebhook()
        const videoId = await uploadVideo(
          await createTestMediaFile({ width: 640, height: 360, seconds: 2 })
        )
        const apiKey = (
          await (
            await ownerClient.post(`${libraryPath}/api-keys`, {
              name: "Status",
              scopes: ["videos:read"],
            })
          ).json()
        ).data.secret

        await processVideo(videoId)
        await deliverQueued()
        const status = (
          await (
            await createLibraryApiClient(testApp, apiKey).get(
              `/libraries/${library.id}/videos/${videoId}/status`
            )
          ).json()
        ).data.status
        const ready = receivedEvents().at(-1)!

        expect(ready.type).toBe("video.processing.ready")
        expect(ready.data).toEqual(status)
        expect(status).toEqual(
          expect.objectContaining({
            processingStatus: "ready",
            width: 640,
            height: 360,
            renditions: [expect.objectContaining({ quality: "360p" })],
            processedAt: expect.any(String),
          })
        )
      }
    )
  })
})
