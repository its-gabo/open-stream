import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import {
  chatCompletionAnswer,
  startChapterGenerationServer,
} from "../../../test/helpers/chapter-generation-server"
import { fakeMediaToolkit } from "../../../test/helpers/fake-media-toolkit"
import { findVideoProcessingRequests } from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { CHAPTER_GENERATION_MODEL } from "@workspace/shared"

import { eq } from "drizzle-orm"

import {
  chapterGenerationProviders,
  chapterGenerationUsages,
} from "../../db/schema"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { VideoCaptionDto } from "../../captions/dto/captions.schemas"
import type { MediaToolkit } from "../../media/types/media.types"
import type { ChapterGenerationProviderDto } from "../dto/chapter-generation.schemas"

const VIDEO_DURATION_SECONDS = 120

/** Cues spread over the video, so chapters can be snapped to their starts. */
const LESSON_VTT = [
  "WEBVTT",
  "",
  "00:00:01.000 --> 00:00:04.000",
  "Hello and <b>welcome</b> to the course.",
  "",
  "00:00:31.500 --> 00:00:35.000",
  "Let's install the tools.",
  "",
  "00:01:02.250 --> 00:01:06.000",
  "Now we write our first program.",
  "",
  "00:01:50.000 --> 00:01:55.000",
  "Thanks for watching.",
  "",
].join("\n")

describe("Chapter generation (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let libraryId: string
  let libraryPath: string
  let generationServer: ReturnType<typeof startChapterGenerationServer>

  const mediaToolkit: MediaToolkit = {
    ...fakeMediaToolkit,
    probe: async (source) => {
      const probe = await fakeMediaToolkit.probe(source)

      return probe && { ...probe, durationSeconds: VIDEO_DURATION_SECONDS }
    },
  }

  beforeEach(async () => {
    generationServer = startChapterGenerationServer()
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
    generationServer.stop()
    await testApp.close()
  })

  const providersPath = "/organizations/acme/chapter-generation-providers"

  const createProvider = async (body: Record<string, unknown> = {}) =>
    (
      await (
        await ownerClient.post(providersPath, {
          kind: "openai_compatible",
          name: "Our model server",
          baseUrl: generationServer.baseUrl,
          apiKey: "sk-local-1234",
          ...body,
        })
      ).json()
    ).data.provider as ChapterGenerationProviderDto

  /** Creates a provider and makes it the library's. */
  const useProvider = async () => {
    const provider = await createProvider()

    await ownerClient.put(`${libraryPath}/chapter-generation`, {
      providerId: provider.id,
    })

    return provider
  }

  /** Uploads and processes a video, then gives it an English track. */
  const createVideoWithCaptions = async () => {
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

    const form = new FormData()

    form.append("language", "en")
    form.append("label", "English")
    form.append("kind", "subtitles")
    form.append("file", new File([LESSON_VTT], "lesson.vtt"))

    const { caption } = (
      await (
        await memberClient.request(
          `${libraryPath}/videos/${video.id}/captions`,
          { method: "POST", formData: form }
        )
      ).json()
    ).data as { caption: VideoCaptionDto }

    return { videoId: video.id as string, captionId: caption.id }
  }

  const suggestChapters = (videoId: string, captionId: string) =>
    memberClient.post(`${libraryPath}/videos/${videoId}/chapter-suggestions`, {
      captionId,
    })

  const completionRequests = () =>
    generationServer.received.filter(
      ({ path }) => path === "/v1/chat/completions"
    )

  describe("providers", () => {
    it("connects a provider without returning its key, always with the fixed model", async () => {
      const provider = await createProvider()
      const listed = await ownerClient.get(providersPath)
      const [activity] = (
        await (
          await ownerClient.get(
            `/organizations/acme/activity?resourceType=chapter_generation_provider&resourceId=${provider.id}`
          )
        ).json()
      ).data.activities as ActivityLogDto[]

      expect(provider).toMatchObject({
        name: "Our model server",
        kind: "openai_compatible",
        baseUrl: generationServer.baseUrl,
        model: CHAPTER_GENERATION_MODEL,
        apiKeyHint: "1234",
        libraryCount: 0,
      })
      expect(JSON.stringify(await listed.json())).not.toContain("sk-local")
      expect(activity).toMatchObject({
        action: "chapter_generation_provider.created",
        after: { name: "Our model server", apiKeyHint: "1234" },
      })
    })

    it("refuses a model of the owner's choosing, and OpenAI without a key", async () => {
      const withoutKey = await ownerClient.post(providersPath, {
        kind: "openai",
        name: "OpenAI",
      })
      const openAi = await createProvider({
        kind: "openai",
        name: "OpenAI",
        baseUrl: undefined,
        apiKey: "sk-openai-5678",
        model: "gpt-4o",
      })

      expect(withoutKey.status).toBe(422)
      expect(openAi).toMatchObject({
        baseUrl: "https://api.openai.com/v1",
        model: CHAPTER_GENERATION_MODEL,
      })
    })

    it("lets only the owner manage providers", async () => {
      const provider = await createProvider()

      expect((await memberClient.get(providersPath)).status).toBe(403)
      expect(
        (
          await memberClient.post(providersPath, {
            kind: "openai_compatible",
            name: "Mine",
            baseUrl: generationServer.baseUrl,
            apiKey: null,
          })
        ).status
      ).toBe(403)
      expect(
        (await memberClient.delete(`${providersPath}/${provider.id}`)).status
      ).toBe(403)
    })

    it("tests a provider's connection and key without generating anything", async () => {
      const provider = await createProvider()
      const working = await ownerClient.post(
        `${providersPath}/${provider.id}/connection-tests`
      )

      generationServer.modelsStatus = 401

      const refused = await ownerClient.post(
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
      expect(generationServer.received.map(({ path }) => path)).toEqual([
        "/v1/models",
        "/v1/models",
      ])
      expect(generationServer.received[0]!.authorization).toBe(
        "Bearer sk-local-1234"
      )
    })

    it("drops the saved key when the address changes, unless a new one is given", async () => {
      const provider = await createProvider()
      const moved = await ownerClient.put(`${providersPath}/${provider.id}`, {
        name: "Moved",
        baseUrl: "http://127.0.0.1:9/v1",
      })

      expect((await moved.json()).data.provider).toMatchObject({
        name: "Moved",
        baseUrl: "http://127.0.0.1:9/v1",
        apiKeyHint: null,
      })
    })

    it("deletes a provider only once no library uses it", async () => {
      const provider = await useProvider()
      const inUse = await ownerClient.delete(`${providersPath}/${provider.id}`)

      await ownerClient.put(`${libraryPath}/chapter-generation`, {
        providerId: null,
      })

      const deleted = await ownerClient.delete(
        `${providersPath}/${provider.id}`
      )

      expect(inUse.status).toBe(409)
      expect((await inUse.json()).code).toBe(
        "chapter_generation_provider.in_use"
      )
      expect(deleted.status).toBe(200)
      expect(
        (await (await ownerClient.get(providersPath)).json()).data.providers
      ).toEqual([])
    })
  })

  describe("library settings", () => {
    it("assigns one of the organization's providers to a library", async () => {
      const provider = await createProvider()
      const saved = await ownerClient.put(`${libraryPath}/chapter-generation`, {
        providerId: provider.id,
      })
      const read = await ownerClient.get(`${libraryPath}/chapter-generation`)
      const [activity] = (
        await (
          await ownerClient.get(
            `/organizations/acme/activity?resourceType=library&resourceId=${libraryId}`
          )
        ).json()
      ).data.activities as ActivityLogDto[]

      expect((await saved.json()).data.chapterGeneration).toEqual({
        providerId: provider.id,
      })
      expect((await read.json()).data.chapterGeneration).toEqual({
        providerId: provider.id,
      })
      expect(activity).toMatchObject({
        action: "library.chapter_generation_updated",
        after: { chapterGenerationProviderId: provider.id },
      })
    })

    it("refuses a provider of another organization, and members", async () => {
      const unknown = await ownerClient.put(
        `${libraryPath}/chapter-generation`,
        { providerId: crypto.randomUUID() }
      )
      const byMember = await memberClient.get(
        `${libraryPath}/chapter-generation`
      )

      expect(unknown.status).toBe(404)
      expect((await unknown.json()).code).toBe(
        "chapter_generation_provider.not_found"
      )
      expect(byMember.status).toBe(403)
    })
  })

  describe("suggesting chapters", () => {
    it("asks the provider for gpt-6-luna's chapters from the track, without saving them", async () => {
      await useProvider()
      const { videoId, captionId } = await createVideoWithCaptions()

      generationServer.answer = {
        status: 200,
        body: chatCompletionAnswer({
          chapters: [
            { startSeconds: 0, title: "Welcome" },
            { startSeconds: 31, title: "Installing the tools" },
            { startSeconds: 62, title: "Your first program" },
          ],
        }),
      }

      const response = await suggestChapters(videoId, captionId)
      const [request] = completionRequests()
      const prompt = JSON.stringify(request!.body!.messages)
      const { video } = (
        await (
          await memberClient.get(`${libraryPath}/videos/${videoId}`)
        ).json()
      ).data

      expect(response.status).toBe(200)
      expect((await response.json()).data.chapters).toEqual([
        { startSeconds: 0, title: "Welcome" },
        { startSeconds: 31.5, title: "Installing the tools" },
        { startSeconds: 62.25, title: "Your first program" },
      ])
      expect(request!.authorization).toBe("Bearer sk-local-1234")
      expect(request!.body!.model).toBe(CHAPTER_GENERATION_MODEL)
      expect(request!.body!.response_format).toMatchObject({
        type: "json_schema",
      })
      expect(prompt).toContain("[1] Hello and welcome to the course.")
      expect(prompt).toContain("[31] Let's install the tools.")
      expect(video.chapters).toEqual([])
    })

    it("keeps only chapters the video accepts from what the model proposes", async () => {
      await useProvider()
      const { videoId, captionId } = await createVideoWithCaptions()

      generationServer.answer = {
        status: 200,
        body: chatCompletionAnswer({
          chapters: [
            { startSeconds: 62, title: "  Your   first program " },
            { startSeconds: 3, title: "Intro" },
            { startSeconds: 33, title: "Installing the tools" },
            { startSeconds: 35, title: "Installing, said twice" },
            { startSeconds: 500, title: "After the end" },
            { startSeconds: 90, title: "   " },
          ],
        }),
      }

      const response = await suggestChapters(videoId, captionId)

      expect((await response.json()).data.chapters).toEqual([
        { startSeconds: 0, title: "Intro" },
        { startSeconds: 31.5, title: "Installing the tools" },
        { startSeconds: 62.25, title: "Your first program" },
      ])
    })

    it("needs the library to have a provider, and a track of the video", async () => {
      const { videoId, captionId } = await createVideoWithCaptions()
      const withoutProvider = await suggestChapters(videoId, captionId)

      await useProvider()

      const unknownTrack = await suggestChapters(videoId, crypto.randomUUID())

      expect(withoutProvider.status).toBe(409)
      expect((await withoutProvider.json()).code).toBe(
        "video.chapter_generation.not_configured"
      )
      expect(unknownTrack.status).toBe(404)
      expect((await unknownTrack.json()).code).toBe("video.caption.not_found")
      expect(completionRequests()).toEqual([])
    })

    for (const { name, answer, status, code } of [
      {
        name: "the key is refused",
        answer: { status: 401, body: { error: { message: "bad key" } } },
        status: 409,
        code: "video.chapter_generation.provider_auth_failed",
      },
      {
        name: "the model is unknown",
        answer: { status: 404, body: { error: { message: "no such model" } } },
        status: 409,
        code: "video.chapter_generation.provider_rejected",
      },
      {
        name: "the provider fails",
        answer: { status: 500, body: { error: { message: "oops" } } },
        status: 503,
        code: "video.chapter_generation.provider_unavailable",
      },
      {
        name: "the answer is not chapters",
        answer: { status: 200, body: chatCompletionAnswer("not json at all") },
        status: 503,
        code: "video.chapter_generation.invalid_answer",
      },
      {
        name: "no chapter lies within the video",
        answer: {
          status: 200,
          body: chatCompletionAnswer({
            chapters: [{ startSeconds: 900, title: "Later" }],
          }),
        },
        status: 503,
        code: "video.chapter_generation.invalid_answer",
      },
    ]) {
      it(`says so when ${name}`, async () => {
        await useProvider()
        const { videoId, captionId } = await createVideoWithCaptions()

        generationServer.answer = answer

        const response = await suggestChapters(videoId, captionId)

        expect(response.status).toBe(status)
        expect((await response.json()).code).toBe(code)
      })
    }
  })

  describe("monthly token limit", () => {
    const usageOf = async (providerId: string) => {
      const { providers } = (
        await (await ownerClient.get(providersPath)).json()
      ).data as { providers: ChapterGenerationProviderDto[] }

      return providers.find(({ id }) => id === providerId)!
    }

    it("counts the tokens the provider reports for each request", async () => {
      const provider = await useProvider()
      const { videoId, captionId } = await createVideoWithCaptions()

      await suggestChapters(videoId, captionId)
      await suggestChapters(videoId, captionId)

      expect(await usageOf(provider.id)).toMatchObject({
        monthlyTokenLimit: null,
        tokensUsedThisMonth: 240,
      })
    })

    it("refuses a request whose estimate would pass the limit, without asking the provider", async () => {
      const provider = await createProvider({ monthlyTokenLimit: 1_000 })
      await ownerClient.put(`${libraryPath}/chapter-generation`, {
        providerId: provider.id,
      })
      const { videoId, captionId } = await createVideoWithCaptions()

      const response = await suggestChapters(videoId, captionId)

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe(
        "video.chapter_generation.usage_limit_reached"
      )
      expect(completionRequests()).toEqual([])
      expect((await usageOf(provider.id)).tokensUsedThisMonth).toBe(0)
    })

    it("counts only the tokens a failed request reported", async () => {
      const provider = await useProvider()
      const { videoId, captionId } = await createVideoWithCaptions()
      generationServer.answer = {
        status: 500,
        body: { error: { message: "oops" } },
      }

      await suggestChapters(videoId, captionId)

      expect((await usageOf(provider.id)).tokensUsedThisMonth).toBe(0)
    })

    it("keeps the estimate when the provider does not count tokens", async () => {
      const provider = await useProvider()
      const { videoId, captionId } = await createVideoWithCaptions()
      const { usage: _usage, ...withoutUsage } = chatCompletionAnswer({
        chapters: [{ startSeconds: 0, title: "Welcome" }],
      })
      generationServer.answer = { status: 200, body: withoutUsage }

      await suggestChapters(videoId, captionId)

      expect((await usageOf(provider.id)).tokensUsedThisMonth).toBeGreaterThan(
        16_000
      )
    })

    it("lets a limit with room for the prompt pass, capping the answer to what is left", async () => {
      const provider = await createProvider({ monthlyTokenLimit: 5_000 })
      await ownerClient.put(`${libraryPath}/chapter-generation`, {
        providerId: provider.id,
      })
      const { videoId, captionId } = await createVideoWithCaptions()

      const response = await suggestChapters(videoId, captionId)
      const [request] = completionRequests()
      const maxTokens = (request!.body as { max_tokens?: number }).max_tokens

      expect(response.status).toBe(200)
      expect(maxTokens).toBeGreaterThanOrEqual(2_000)
      expect(maxTokens).toBeLessThan(5_000)
      expect((await usageOf(provider.id)).tokensUsedThisMonth).toBe(120)
    })

    it("stops counting a reservation that was never settled once its request would have timed out", async () => {
      const provider = await useProvider()
      const { videoId } = await createVideoWithCaptions()
      const [{ organizationId }] = await testApp.appModule.db
        .select({ organizationId: chapterGenerationProviders.organizationId })
        .from(chapterGenerationProviders)
        .where(eq(chapterGenerationProviders.id, provider.id))

      await testApp.appModule.db.insert(chapterGenerationUsages).values([
        {
          organizationId,
          providerId: provider.id,
          videoId,
          tokens: 30_000,
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
        },
        {
          organizationId,
          providerId: provider.id,
          videoId,
          tokens: 20_000,
        },
      ])

      expect((await usageOf(provider.id)).tokensUsedThisMonth).toBe(20_000)
    })

    it("keeps the limit when an update leaves it out, and removes it when null", async () => {
      const provider = await createProvider({ monthlyTokenLimit: 50_000 })
      const kept = await ownerClient.put(`${providersPath}/${provider.id}`, {
        name: "Renamed",
        baseUrl: generationServer.baseUrl,
      })
      const removed = await ownerClient.put(`${providersPath}/${provider.id}`, {
        name: "Renamed",
        baseUrl: generationServer.baseUrl,
        monthlyTokenLimit: null,
      })

      expect((await kept.json()).data.provider.monthlyTokenLimit).toBe(50_000)
      expect((await removed.json()).data.provider.monthlyTokenLimit).toBeNull()
    })
  })

  describe("provider failures", () => {
    it("says so when the provider cannot be reached", async () => {
      const provider = await useProvider()
      const { videoId, captionId } = await createVideoWithCaptions()

      await ownerClient.put(`${providersPath}/${provider.id}`, {
        name: "Gone",
        baseUrl: "http://127.0.0.1:9/v1",
      })

      const response = await suggestChapters(videoId, captionId)

      expect(response.status).toBe(503)
      expect((await response.json()).code).toBe(
        "video.chapter_generation.provider_unavailable"
      )
    })
  })
})
