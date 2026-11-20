import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { fakeMediaToolkit } from "../../../test/helpers/fake-media-toolkit"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import { findVideoProcessingRequests } from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"

import { webhookDeliveries } from "../../db/schema"
import { INVALID_CHAPTER_LISTS } from "./video-chapters.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { MediaToolkit } from "../../media/types/media.types"
import type { VideoDto } from "../dto/libraries.schemas"

const CHAPTERS = [
  { title: "Intro", startSeconds: 0 },
  { title: "Demo", startSeconds: 1 },
  { title: "Q&A <live>", startSeconds: 2 },
]

describe("Video chapters (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let libraryId: string
  let libraryPath: string
  /** How long the next processed file lasts. */
  let probedSeconds: number

  const mediaToolkit: MediaToolkit = {
    ...fakeMediaToolkit,
    probe: async (source) => {
      const probe = await fakeMediaToolkit.probe(source)

      return probe && { ...probe, durationSeconds: probedSeconds }
    },
  }

  beforeEach(async () => {
    probedSeconds = 3
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
        .create({ name: "Marketing" })
    ).id
    libraryPath = `/organizations/acme/libraries/${libraryId}`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  })

  afterEach(() => testApp.close())

  /** Uploads a video and, unless `process` is false, runs what the worker runs for it. */
  const createVideo = async ({ process = true } = {}) => {
    const { video } = (
      await (
        await memberClient.post(`${libraryPath}/videos`, { title: "Launch" })
      ).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)

    await createTusClient(
      memberClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "launch.mp4", bytes.byteLength)

    if (process) await processVideo(video.id)

    return video.id as string
  }

  /** Runs what the worker runs for the video's latest processing request. */
  const processVideo = async (videoId: string) => {
    const request = (await findVideoProcessingRequests(testApp))
      .filter((each) => each.videoId === videoId)
      .at(-1)

    if (!request) throw new Error(`No processing request for ${videoId}`)

    await testApp.appModule.videoProcessingService.processVideo(request, {
      isFinalAttempt: true,
    })
  }

  const putChapters = (videoId: string, chapters: unknown) =>
    memberClient.put(`${libraryPath}/videos/${videoId}/chapters`, {
      chapters,
    })

  const readVideo = async (videoId: string): Promise<VideoDto> =>
    (await (await memberClient.get(`${libraryPath}/videos/${videoId}`)).json())
      .data.video

  const videoApiPath = (videoId: string) =>
    `/libraries/${libraryId}/videos/${videoId}`

  it("saves a processed video's chapters in order", async () => {
    const videoId = await createVideo()

    const response = await putChapters(videoId, CHAPTERS)

    expect(response.status).toBe(200)
    expect((await response.json()).data.video.chapters).toEqual(CHAPTERS)
    expect((await readVideo(videoId)).chapters).toEqual(CHAPTERS)
  })

  it("keeps chapter titles trimmed and start times to the millisecond", async () => {
    const videoId = await createVideo()

    const response = await putChapters(videoId, [
      { title: "  Intro  ", startSeconds: 0 },
      { title: "Demo", startSeconds: 1.23456 },
    ])

    expect((await response.json()).data.video.chapters).toEqual([
      { title: "Intro", startSeconds: 0 },
      { title: "Demo", startSeconds: 1.235 },
    ])
  })

  it("removes every chapter when given an empty list", async () => {
    const videoId = await createVideo()
    await putChapters(videoId, CHAPTERS)

    const response = await putChapters(videoId, [])

    expect(response.status).toBe(200)
    expect((await readVideo(videoId)).chapters).toEqual([])
  })

  it.each(INVALID_CHAPTER_LISTS)(
    "refuses $description",
    async ({ chapters }) => {
      const videoId = await createVideo()

      const response = await putChapters(videoId, chapters)

      expect(response.status).toBe(422)
      expect((await readVideo(videoId)).chapters).toEqual([])
    }
  )

  it.each([
    { description: "at the end of the video", startSeconds: 3 },
    { description: "less than a second before the end", startSeconds: 2.5 },
  ])(
    "refuses a last chapter that starts $description",
    async ({ startSeconds }) => {
      const videoId = await createVideo()

      const response = await putChapters(videoId, [
        { title: "Intro", startSeconds: 0 },
        { title: "Credits", startSeconds },
      ])

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe("video.chapters.out_of_range")
    }
  )

  it("accepts a last chapter that lasts exactly a second", async () => {
    const videoId = await createVideo()

    const response = await putChapters(videoId, [
      { title: "Intro", startSeconds: 0 },
      { title: "Credits", startSeconds: 2 },
    ])

    expect(response.status).toBe(200)
  })

  it("refuses chapters for a video that is not processed", async () => {
    const videoId = await createVideo({ process: false })

    const response = await putChapters(videoId, CHAPTERS)

    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("video.not_ready")
  })

  it("drops the chapters a shorter file no longer reaches when processed again", async () => {
    const videoId = await createVideo()
    await putChapters(videoId, CHAPTERS)

    probedSeconds = 2
    await memberClient.post(`${libraryPath}/videos/${videoId}/reprocess`)
    await processVideo(videoId)

    expect((await readVideo(videoId)).chapters).toEqual(CHAPTERS.slice(0, 2))
  })

  it("records the change in the activity log and tells webhooks", async () => {
    const videoId = await createVideo()
    await ownerClient.put(`${libraryPath}/webhook`, {
      url: "https://hooks.example.com/openstream",
    })

    await putChapters(videoId, CHAPTERS)

    const [activity] = (
      await (
        await ownerClient.get(
          `/organizations/acme/activity?resourceType=video&resourceId=${videoId}`
        )
      ).json()
    ).data.activities as ActivityLogDto[]

    expect(activity).toEqual(
      expect.objectContaining({
        action: "video.chapters_updated",
        before: { chapters: [] },
        after: { chapters: CHAPTERS },
      })
    )
    expect(
      (
        await testApp.appModule.db
          .select({ eventType: webhookDeliveries.eventType })
          .from(webhookDeliveries)
      ).map(({ eventType }) => eventType)
    ).toContain("video.updated")
  })

  it("records nothing when the chapters stay the same", async () => {
    const videoId = await createVideo()
    await putChapters(videoId, CHAPTERS)

    const response = await putChapters(videoId, CHAPTERS)
    const activities = (
      await (
        await ownerClient.get(
          `/organizations/acme/activity?resourceType=video&resourceId=${videoId}`
        )
      ).json()
    ).data.activities as ActivityLogDto[]

    expect(response.status).toBe(200)
    expect(
      activities.filter(({ action }) => action === "video.chapters_updated")
    ).toHaveLength(1)
  })

  it("keeps other organizations' members away from the chapters", async () => {
    const videoId = await createVideo()
    const outsider = await createUserFactory(testApp).create()
    await createOrganizationFactory(testApp)
      .ownedBy(outsider)
      .create({ name: "Other", slug: "other" })
    const outsiderClient = await signInAsUser(testApp, outsider)

    const response = await outsiderClient.put(
      `${libraryPath}/videos/${videoId}/chapters`,
      { chapters: CHAPTERS }
    )

    expect(response.status).toBe(404)
    expect((await readVideo(videoId)).chapters).toEqual([])
  })

  it("lets the library API change the chapters with videos:manage", async () => {
    const videoId = await createVideo()
    const createKey = async (scopes: string[]) =>
      createLibraryApiClient(
        testApp,
        (
          await (
            await ownerClient.post(`${libraryPath}/api-keys`, {
              name: scopes.join(" "),
              scopes,
            })
          ).json()
        ).data.secret
      )
    const managing = await createKey(["videos:manage"])
    const reading = await createKey(["videos:read"])

    const refused = await reading.put(`${videoApiPath(videoId)}/chapters`, {
      chapters: CHAPTERS,
    })
    const saved = await managing.put(`${videoApiPath(videoId)}/chapters`, {
      chapters: CHAPTERS,
    })

    expect(refused.status).toBe(403)
    expect(saved.status).toBe(200)
    expect((await readVideo(videoId)).chapters).toEqual(CHAPTERS)
  })

  it("gives the embedded player the chapters", async () => {
    const videoId = await createVideo()
    await putChapters(videoId, CHAPTERS)

    const response = await createLibraryApiClient(testApp).get(
      `${videoApiPath(videoId)}/embed`
    )

    expect((await response.json()).data.embed.chapters).toEqual(CHAPTERS)
  })

  it("serves the chapters as a WebVTT chapters track", async () => {
    const videoId = await createVideo()
    await putChapters(videoId, CHAPTERS)

    const response = await createLibraryApiClient(testApp).get(
      `${videoApiPath(videoId)}/chapters.vtt`
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toStartWith("text/vtt")
    expect(await response.text()).toBe(
      [
        "WEBVTT",
        "",
        "1",
        "00:00:00.000 --> 00:00:01.000",
        "Intro",
        "",
        "2",
        "00:00:01.000 --> 00:00:02.000",
        "Demo",
        "",
        "3",
        "00:00:02.000 --> 00:00:03.000",
        "Q&amp;A &lt;live&gt;",
        "",
      ].join("\n")
    )
  })

  it("serves an empty track for a video without chapters", async () => {
    const videoId = await createVideo()

    const response = await createLibraryApiClient(testApp).get(
      `${videoApiPath(videoId)}/chapters.vtt`
    )

    expect(await response.text()).toBe("WEBVTT\n")
  })

  it("applies the library's playback rules to the chapters track", async () => {
    const videoId = await createVideo()
    await ownerClient.put(`${libraryPath}/security`, {
      allowedPlaybackHosts: ["videos.example.com"],
      requireSignedPlayback: false,
    })

    const response = await createLibraryApiClient(testApp).request(
      `${videoApiPath(videoId)}/chapters.vtt`,
      { headers: { referer: "https://elsewhere.example.org/" } }
    )

    expect(response.status).toBe(403)
  })
})
