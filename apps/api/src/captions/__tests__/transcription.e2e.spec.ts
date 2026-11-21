import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { fakeMediaToolkit } from "../../../test/helpers/fake-media-toolkit"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import { findVideoProcessingRequests } from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import {
  startTranscriptionServer,
  transcriptAnswer,
} from "../../../test/helpers/transcription-server"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { asc, eq } from "drizzle-orm"

import {
  outboxMessages,
  transcriptionProviders,
  videoTranscriptions,
  webhookDeliveries,
} from "../../db/schema"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import { TRANSCRIPTION_AUDIO_CHUNK_SECONDS } from "../constants/captions.constants"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { MediaToolkit } from "../../media/types/media.types"
import type {
  TranscriptionProviderDto,
  VideoTranscriptionDto,
} from "../dto/captions.schemas"
import type {
  TranscribeVideoPayload,
  VideoProcessedPayload,
} from "../types/captions.types"

/** The fake toolkit extracts two chunks, so a video spans both. */
const VIDEO_DURATION_SECONDS = TRANSCRIPTION_AUDIO_CHUNK_SECONDS + 30

describe("Transcription (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let libraryId: string
  let libraryPath: string
  let transcriptionServer: ReturnType<typeof startTranscriptionServer>
  let hasAudio: boolean

  const mediaToolkit: MediaToolkit = {
    ...fakeMediaToolkit,
    probe: async (source) => {
      const probe = await fakeMediaToolkit.probe(source)

      return (
        probe && {
          ...probe,
          durationSeconds: VIDEO_DURATION_SECONDS,
          audioCodec: hasAudio ? probe.audioCodec : null,
        }
      )
    },
  }

  beforeEach(async () => {
    hasAudio = true
    transcriptionServer = startTranscriptionServer()
    testApp = await createTestApp({}, { mediaToolkit })
    const owner = await createUserFactory(testApp).create()
    const member = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    libraryId = (
      await createLibraryFactory(testApp)
        .inOrganization("acme", owner)
        .create({ name: "Courses" })
    ).id
    libraryPath = `/organizations/acme/libraries/${libraryId}`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  })

  afterEach(async () => {
    transcriptionServer.stop()
    await testApp.close()
  })

  const providersPath = "/organizations/acme/transcription-providers"

  const createProvider = async (body: Record<string, unknown> = {}) =>
    (
      await (
        await ownerClient.post(providersPath, {
          kind: "openai_compatible",
          name: "Our Whisper",
          baseUrl: transcriptionServer.baseUrl,
          model: "Systran/faster-whisper-small",
          apiKey: "sk-local-1234",
          ...body,
        })
      ).json()
    ).data.provider as TranscriptionProviderDto

  /** Creates a provider and makes it the library's. */
  const useProvider = async (
    settings: { autoTranscribe?: boolean; language?: string | null } = {}
  ) => {
    const provider = await createProvider()

    await ownerClient.put(`${libraryPath}/transcription`, {
      providerId: provider.id,
      autoTranscribe: settings.autoTranscribe ?? false,
      language: settings.language ?? null,
    })

    return provider
  }

  /** Uploads a video and runs what the worker runs to process it. */
  const createVideo = async () => {
    const { video } = (
      await (
        await memberClient.post(`${libraryPath}/videos`, { title: "Lesson 1" })
      ).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)

    await createTusClient(
      memberClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "lesson.mp4", bytes.byteLength)

    const request = (await findVideoProcessingRequests(testApp)).find(
      (each) => each.videoId === video.id
    )

    await testApp.appModule.videoProcessingService.processVideo(request!, {
      isFinalAttempt: true,
    })

    return video.id as string
  }

  const outboxPayloads = async <TPayload>(type: string) =>
    (
      await testApp.appModule.db
        .select()
        .from(outboxMessages)
        .where(eq(outboxMessages.type, type as never))
        .orderBy(asc(outboxMessages.createdAt))
    ).map(({ payload }) => payload as TPayload)

  /** Runs what the worker runs for every queued transcription. */
  const runTranscriptions = async ({ isFinalAttempt = true } = {}) => {
    const errors: unknown[] = []

    for (const payload of await outboxPayloads<TranscribeVideoPayload>(
      OUTBOX_MESSAGE_TYPES.TRANSCRIBE_VIDEO
    )) {
      await testApp.appModule.videoTranscriptionsService
        .transcribeVideo(payload, { isFinalAttempt })
        .catch((error: unknown) => errors.push(error))
    }

    return errors
  }

  const requestTranscription = (videoId: string, body: unknown = {}) =>
    memberClient.post(`${libraryPath}/videos/${videoId}/transcriptions`, body)

  const listVideoCaptions = async (videoId: string) =>
    (
      await (
        await memberClient.get(`${libraryPath}/videos/${videoId}/captions`)
      ).json()
    ).data as {
      captions: {
        id: string
        language: string
        label: string
        source: string
      }[]
      transcriptions: VideoTranscriptionDto[]
    }

  describe("providers", () => {
    it("lets the owner connect a provider without ever showing its key", async () => {
      const response = await ownerClient.post(providersPath, {
        kind: "openai",
        name: "OpenAI",
        model: "whisper-1",
        apiKey: "sk-proj-secret-abcd",
      })
      const { provider } = (await response.json()).data
      const [stored] = await testApp.appModule.db
        .select()
        .from(transcriptionProviders)
      const listed = await (await ownerClient.get(providersPath)).json()

      expect(response.status).toBe(201)
      expect(provider).toEqual({
        id: expect.any(String),
        name: "OpenAI",
        kind: "openai",
        baseUrl: "https://api.openai.com/v1",
        model: "whisper-1",
        apiKeyHint: "abcd",
        libraryCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(JSON.stringify(stored!.apiKey)).not.toContain("sk-proj-secret")
      expect(stored!.baseUrl).toBeNull()
      expect(listed.data.providers).toEqual([provider])
    })

    it("needs a key for OpenAI and an address for a server of one's own", async () => {
      const responses = await Promise.all([
        ownerClient.post(providersPath, {
          kind: "openai",
          name: "OpenAI",
          model: "whisper-1",
          apiKey: null,
        }),
        ownerClient.post(providersPath, {
          kind: "openai_compatible",
          name: "Ours",
          model: "whisper",
          apiKey: null,
        }),
        ownerClient.post(providersPath, {
          kind: "openai_compatible",
          name: "Ours",
          baseUrl: "ftp://whisper.example.com",
          model: "whisper",
          apiKey: null,
        }),
      ])

      expect(responses.map(({ status }) => status)).toEqual([422, 422, 422])
    })

    it("refuses private addresses where the config does not allow them", async () => {
      const strictApp = await createTestApp(
        { TRANSCRIPTION_ALLOW_PRIVATE_ENDPOINTS: "false" },
        { mediaToolkit }
      )
      const owner = await createUserFactory(strictApp).create()

      await createOrganizationFactory(strictApp)
        .ownedBy(owner)
        .create({ name: "Strict", slug: "strict" })
      const client = await signInAsUser(strictApp, owner)

      const response = await client.post(
        "/organizations/strict/transcription-providers",
        {
          kind: "openai_compatible",
          name: "Local",
          baseUrl: "http://127.0.0.1:9000/v1",
          model: "whisper",
          apiKey: null,
        }
      )

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe(
        "transcription_provider.endpoint_not_allowed"
      )
      await strictApp.close()
    })

    it("keeps providers to the owner", async () => {
      const provider = await createProvider()

      const responses = await Promise.all([
        memberClient.get(providersPath),
        memberClient.post(providersPath, {
          kind: "openai",
          name: "Mine",
          model: "whisper-1",
          apiKey: "sk-1",
        }),
        memberClient.delete(`${providersPath}/${provider.id}`),
        memberClient.get(`${libraryPath}/transcription`),
      ])

      expect(responses.map(({ status }) => status)).toEqual([
        403, 403, 403, 403,
      ])
    })

    it("changes a provider, keeping its key unless a new one is given", async () => {
      const provider = await createProvider()

      const renamed = await ownerClient.put(`${providersPath}/${provider.id}`, {
        name: "Whisper large",
        baseUrl: transcriptionServer.baseUrl,
        model: "Systran/faster-whisper-large-v3",
      })
      const keyRemoved = await ownerClient.put(
        `${providersPath}/${provider.id}`,
        {
          name: "Whisper large",
          baseUrl: transcriptionServer.baseUrl,
          model: "Systran/faster-whisper-large-v3",
          apiKey: null,
        }
      )
      const [activity] = (
        await (
          await ownerClient.get(
            `/organizations/acme/activity?resourceType=transcription_provider&resourceId=${provider.id}`
          )
        ).json()
      ).data.activities as ActivityLogDto[]

      expect((await renamed.json()).data.provider).toMatchObject({
        name: "Whisper large",
        apiKeyHint: "1234",
      })
      expect((await keyRemoved.json()).data.provider.apiKeyHint).toBeNull()
      expect(activity).toMatchObject({
        action: "transcription_provider.updated",
        before: { apiKeyHint: "1234" },
        after: { apiKeyHint: null },
        context: { apiKeyChanged: true },
      })
    })

    it("drops the saved key when the address changes, unless a new one is given", async () => {
      const provider = await createProvider()
      const update = (baseUrl: string, apiKey?: string) =>
        ownerClient.put(`${providersPath}/${provider.id}`, {
          name: provider.name,
          baseUrl,
          model: provider.model,
          ...(apiKey && { apiKey }),
        })

      const moved = await update(`${transcriptionServer.baseUrl}/other`)
      const withKey = await update(transcriptionServer.baseUrl, "sk-new-5678")
      const kept = await update(transcriptionServer.baseUrl)

      expect((await moved.json()).data.provider.apiKeyHint).toBeNull()
      expect((await withKey.json()).data.provider.apiKeyHint).toBe("5678")
      expect((await kept.json()).data.provider.apiKeyHint).toBe("5678")
    })

    it("tests a saved provider's address and key", async () => {
      const provider = await createProvider()

      const working = await ownerClient.post(
        `${providersPath}/${provider.id}/connection-tests`
      )
      transcriptionServer.modelsStatus = 401
      const refused = await ownerClient.post(
        `${providersPath}/${provider.id}/connection-tests`
      )
      transcriptionServer.stop()
      const unreachable = await ownerClient.post(
        `${providersPath}/${provider.id}/connection-tests`
      )

      expect((await working.json()).data.connection).toEqual({
        isReachable: true,
        isAuthorized: true,
      })
      expect((await refused.json()).data.connection).toEqual({
        isReachable: true,
        isAuthorized: false,
      })
      expect((await unreachable.json()).data.connection).toEqual({
        isReachable: false,
        isAuthorized: false,
      })
      expect(transcriptionServer.received[0]?.authorization).toBe(
        "Bearer sk-local-1234"
      )
    })

    it("keeps a provider libraries use from being deleted", async () => {
      const provider = await useProvider()

      const inUse = await ownerClient.delete(`${providersPath}/${provider.id}`)
      const [listed] = (await (await ownerClient.get(providersPath)).json())
        .data.providers
      await ownerClient.put(`${libraryPath}/transcription`, {
        providerId: null,
        autoTranscribe: false,
        language: null,
      })
      const deleted = await ownerClient.delete(
        `${providersPath}/${provider.id}`
      )

      expect(inUse.status).toBe(409)
      expect(listed.libraryCount).toBe(1)
      expect(deleted.status).toBe(200)
      expect(await (await ownerClient.get(providersPath)).json()).toMatchObject(
        {
          data: { providers: [] },
        }
      )
    })
  })

  describe("library settings", () => {
    it("lets the owner choose the library's provider", async () => {
      const provider = await createProvider()

      const before = await (
        await ownerClient.get(`${libraryPath}/transcription`)
      ).json()
      const response = await ownerClient.put(`${libraryPath}/transcription`, {
        providerId: provider.id,
        autoTranscribe: true,
        language: "en-us",
      })

      expect(before.data.transcription).toEqual({
        providerId: null,
        autoTranscribe: false,
        language: null,
      })
      expect((await response.json()).data.transcription).toEqual({
        providerId: provider.id,
        autoTranscribe: true,
        language: "en-US",
      })
    })

    it("needs a provider to transcribe by itself, and one of the organization's", async () => {
      const responses = await Promise.all([
        ownerClient.put(`${libraryPath}/transcription`, {
          providerId: null,
          autoTranscribe: true,
          language: null,
        }),
        ownerClient.put(`${libraryPath}/transcription`, {
          providerId: crypto.randomUUID(),
          autoTranscribe: false,
          language: null,
        }),
      ])

      expect(responses.map(({ status }) => status)).toEqual([422, 404])
    })
  })

  describe("transcribing", () => {
    it("transcribes each chunk of the sound into one track, shifting its times", async () => {
      await useProvider()
      const videoId = await createVideo()
      transcriptionServer.answers = [
        {
          status: 200,
          body: transcriptAnswer("polish", [
            { start: 1, end: 3, text: " Dzień dobry." },
          ]),
        },
        {
          status: 200,
          body: transcriptAnswer("polish", [
            { start: 2, end: 4.5, text: " Do widzenia." },
          ]),
        },
      ]

      const response = await requestTranscription(videoId)
      const errors = await runTranscriptions()
      const { captions, transcriptions } = await listVideoCaptions(videoId)
      const file = await memberClient.get(
        `${libraryPath}/videos/${videoId}/captions/${captions[0]!.id}/file`
      )
      const audioRequests = transcriptionServer.received.filter(
        ({ fileName }) => fileName
      )

      expect(response.status).toBe(202)
      expect(errors).toEqual([])
      expect(audioRequests.map(({ fileName }) => fileName)).toEqual([
        "chunk_000.mp3",
        "chunk_001.mp3",
      ])
      expect(audioRequests[0]).toMatchObject({
        path: "/v1/audio/transcriptions",
        authorization: "Bearer sk-local-1234",
        fields: {
          model: "Systran/faster-whisper-small",
          response_format: "verbose_json",
          "timestamp_granularities[]": "segment",
        },
      })
      expect(audioRequests[0]!.fields.language).toBeUndefined()
      expect(captions).toEqual([
        expect.objectContaining({
          language: "pl",
          label: "Polski",
          source: "transcription",
        }),
      ])
      expect(await file.text()).toBe(
        "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nDzień dobry.\n\n00:10:02.000 --> 00:10:04.500\nDo widzenia.\n"
      )
      expect(transcriptions).toEqual([
        expect.objectContaining({
          status: "succeeded",
          detectedLanguage: "pl",
          providerName: "Our Whisper",
          model: "Systran/faster-whisper-small",
          finishedAt: expect.any(String),
        }),
      ])
    })

    it("asks for the requested language, or the library's, and files the track under it", async () => {
      await useProvider({ language: "de" })
      const videoId = await createVideo()

      await requestTranscription(videoId, {
        language: "pt-BR",
        kind: "captions",
      })
      await runTranscriptions()
      const { captions } = await listVideoCaptions(videoId)
      const otherVideoId = await createVideo()
      await requestTranscription(otherVideoId)
      const queued = (await listVideoCaptions(otherVideoId)).transcriptions

      expect(transcriptionServer.received[0]?.fields.language).toBe("pt")
      expect(captions).toEqual([
        expect.objectContaining({ language: "pt-BR", kind: "captions" }),
      ])
      expect(queued).toEqual([
        expect.objectContaining({ language: "de", status: "pending" }),
      ])
    })

    it("transcribes a video once at a time", async () => {
      await useProvider()
      const videoId = await createVideo()

      const first = await requestTranscription(videoId)
      const second = await requestTranscription(videoId)

      expect([first.status, second.status]).toEqual([202, 409])
      expect((await second.json()).code).toBe("video.transcription.in_progress")
    })

    it("needs a provider and a video with sound", async () => {
      const videoId = await createVideo()
      const withoutProvider = await requestTranscription(videoId)
      await useProvider()
      hasAudio = false
      const silentVideoId = await createVideo()
      const silent = await requestTranscription(silentVideoId)

      expect(withoutProvider.status).toBe(409)
      expect((await withoutProvider.json()).code).toBe(
        "video.transcription.not_configured"
      )
      expect(silent.status).toBe(409)
      expect((await silent.json()).code).toBe("video.transcription.no_audio")
    })

    it("records who asked for a transcription", async () => {
      await useProvider()
      const videoId = await createVideo()

      const { transcription } = (
        await (await requestTranscription(videoId)).json()
      ).data
      const [activity] = (
        await (
          await ownerClient.get(
            `/organizations/acme/activity?resourceType=video&resourceId=${videoId}`
          )
        ).json()
      ).data.activities as ActivityLogDto[]

      expect(activity).toMatchObject({
        action: "video.transcription_requested",
        context: expect.objectContaining({
          transcriptionId: transcription.id,
          model: "Systran/faster-whisper-small",
        }),
      })
    })

    it("fails for good when the provider refuses the key, and tells the webhook", async () => {
      await useProvider()
      const videoId = await createVideo()
      await ownerClient.put(`${libraryPath}/webhook`, {
        url: "https://hooks.example.com/openstream",
      })
      transcriptionServer.answers = [
        { status: 401, body: { error: { message: "Invalid key" } } },
      ]

      await requestTranscription(videoId)
      const errors = await runTranscriptions({ isFinalAttempt: false })
      const { captions, transcriptions } = await listVideoCaptions(videoId)
      const deliveries = await testApp.appModule.db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.eventType, "video.transcription.failed"))

      expect(errors).toEqual([])
      expect(captions).toEqual([])
      expect(transcriptions[0]).toMatchObject({
        status: "failed",
        failureReason: "provider_auth",
      })
      expect(deliveries.map(({ payload }) => payload.data)).toEqual([
        expect.objectContaining({ videoId, failureReason: "provider_auth" }),
      ])
    })

    it("retries when the provider is down, and fails on the last attempt", async () => {
      await useProvider()
      const videoId = await createVideo()
      transcriptionServer.answers = [{ status: 503, body: {} }]

      await requestTranscription(videoId)
      const retried = await runTranscriptions({ isFinalAttempt: false })
      const afterRetry = (await listVideoCaptions(videoId)).transcriptions[0]
      const lastAttempt = await runTranscriptions({ isFinalAttempt: true })
      const afterLast = (await listVideoCaptions(videoId)).transcriptions[0]

      expect(retried).toHaveLength(1)
      expect(afterRetry?.status).toBe("processing")
      expect(lastAttempt).toEqual([])
      expect(afterLast).toMatchObject({
        status: "failed",
        failureReason: "provider_unreachable",
      })
    })

    it("fails when the provider hears no speech", async () => {
      await useProvider()
      const videoId = await createVideo()
      transcriptionServer.answers = [
        { status: 200, body: transcriptAnswer("english", []) },
      ]

      await requestTranscription(videoId)
      await runTranscriptions()

      expect(
        (await listVideoCaptions(videoId)).transcriptions[0]
      ).toMatchObject({ status: "failed", failureReason: "no_speech" })
    })

    it("fails when the provider was deleted before the worker got to it", async () => {
      const provider = await useProvider()
      const videoId = await createVideo()

      await requestTranscription(videoId)
      await ownerClient.put(`${libraryPath}/transcription`, {
        providerId: null,
        autoTranscribe: false,
        language: null,
      })
      await ownerClient.delete(`${providersPath}/${provider.id}`)
      await runTranscriptions()

      expect(
        (await listVideoCaptions(videoId)).transcriptions[0]
      ).toMatchObject({
        status: "failed",
        failureReason: "provider_removed",
        providerId: null,
      })
      expect(transcriptionServer.received).toEqual([])
    })

    it("replaces an uploaded track of the same language and kind", async () => {
      await useProvider({ language: "en" })
      const videoId = await createVideo()
      const form = new FormData()

      form.append("language", "en")
      form.append("label", "English")
      form.append("kind", "subtitles")
      form.append(
        "file",
        new File(["WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOld\n"], "a.vtt")
      )
      const uploaded = (
        await (
          await memberClient.request(
            `${libraryPath}/videos/${videoId}/captions`,
            {
              method: "POST",
              formData: form,
            }
          )
        ).json()
      ).data.caption

      await requestTranscription(videoId)
      await runTranscriptions()
      const { captions } = await listVideoCaptions(videoId)

      expect(captions).toEqual([
        expect.objectContaining({
          id: uploaded.id,
          source: "transcription",
          label: "English",
        }),
      ])
    })

    it("can be requested with the library API's `videos:manage` scope", async () => {
      await useProvider()
      const videoId = await createVideo()
      const secret = (
        await (
          await ownerClient.post(`${libraryPath}/api-keys`, {
            name: "Pipeline",
            scopes: ["videos:manage"],
          })
        ).json()
      ).data.secret
      const api = createLibraryApiClient(testApp, secret)

      const response = await api.post(
        `/libraries/${libraryId}/videos/${videoId}/transcriptions`,
        {}
      )

      expect(response.status).toBe(202)
      expect((await response.json()).data.transcription.status).toBe("pending")
    })

    it("fails transcriptions whose run stopped renewing its claim", async () => {
      await useProvider()
      const videoId = await createVideo()
      const { transcription } = (
        await (await requestTranscription(videoId)).json()
      ).data

      await testApp.appModule.db
        .update(videoTranscriptions)
        .set({
          status: "processing",
          runId: crypto.randomUUID(),
          heartbeatAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .where(eq(videoTranscriptions.id, transcription.id))

      const failed =
        await testApp.appModule.videoTranscriptionsService.failStalledTranscriptions()
      const again = await requestTranscription(videoId)

      expect(failed).toBe(1)
      expect(again.status).toBe(202)
    })
  })

  describe("automatic transcription", () => {
    const runAutoTranscription = async () => {
      for (const payload of await outboxPayloads<VideoProcessedPayload>(
        OUTBOX_MESSAGE_TYPES.VIDEO_PROCESSED
      )) {
        await testApp.appModule.videoTranscriptionsService.requestAutoTranscription(
          payload
        )
      }
    }

    it("transcribes each processed video once, when the library asks for it", async () => {
      await useProvider({ autoTranscribe: true, language: "en" })
      const videoId = await createVideo()

      await runAutoTranscription()
      await runTranscriptions()
      await runAutoTranscription()
      const { captions, transcriptions } = await listVideoCaptions(videoId)

      expect(captions).toEqual([
        expect.objectContaining({ language: "en", source: "transcription" }),
      ])
      expect(transcriptions).toHaveLength(1)
    })

    it("leaves videos alone in libraries that do not ask for it, and silent ones", async () => {
      const provider = await useProvider({ autoTranscribe: false })
      const videoId = await createVideo()
      await runAutoTranscription()
      const untouched = (await listVideoCaptions(videoId)).transcriptions
      await ownerClient.put(`${libraryPath}/transcription`, {
        providerId: provider.id,
        autoTranscribe: true,
        language: null,
      })
      hasAudio = false
      const silentVideoId = await createVideo()
      await testApp.appModule.videoTranscriptionsService.requestAutoTranscription(
        { videoId: silentVideoId }
      )

      expect(untouched).toEqual([])
      expect((await listVideoCaptions(silentVideoId)).transcriptions).toEqual(
        []
      )
    })
  })
})
