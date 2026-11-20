import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { eq, sql } from "drizzle-orm"

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
import { DAY_MS } from "../../common/time/time.constants"
import { videoViews } from "../../db/schema"
import {
  INVALID_PERIODS,
  INVALID_PROGRESS_REPORTS,
  VIEWER_DEVICES,
} from "./analytics.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"

describe("Analytics (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let viewer: ApiClient
  let libraryId: string
  let libraryPath: string

  beforeEach(async () => {
    testApp = await createTestApp({}, { mediaToolkit: fakeMediaToolkit })
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
    viewer = createLibraryApiClient(testApp)
  })

  afterEach(() => testApp.close())

  /** Uploads a 3-second video and, unless `process` is false, runs what the worker runs for it. */
  const createVideo = async (
    title: string,
    { process = true, path = libraryPath } = {}
  ) => {
    const { video } = (
      await (await ownerClient.post(`${path}/videos`, { title })).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)

    await createTusClient(ownerClient, `${path}/videos/${video.id}`).upload(
      bytes,
      "clip.mp4",
      bytes.byteLength
    )

    if (process) {
      const request = (await findVideoProcessingRequests(testApp)).find(
        (each) => each.videoId === video.id
      )

      await testApp.appModule.videoProcessingService.processVideo(request!, {
        isFinalAttempt: true,
      })
    }

    return video.id as string
  }

  const viewsPath = (videoId: string, library = libraryId) =>
    `/libraries/${library}/videos/${videoId}/views`

  /** Starts a view as the embedded player does when playback starts. */
  const startView = (
    videoId: string,
    {
      embeddingHost,
      userAgent,
      referer,
      query = "",
    }: {
      embeddingHost?: string
      userAgent?: string
      referer?: string
      query?: string
    } = {}
  ) =>
    viewer.request(`${viewsPath(videoId)}${query}`, {
      method: "POST",
      body: embeddingHost ? { embeddingHost } : {},
      headers: {
        ...(userAgent && { "user-agent": userAgent }),
        ...(referer && { referer }),
      },
    })

  const startViewId = async (
    videoId: string,
    options?: Parameters<typeof startView>[1]
  ) => (await (await startView(videoId, options)).json()).data.view.id as string

  /** Makes the view look `seconds` older, as if its last report was that long ago. */
  const letTimePass = (viewId: string, seconds: number) => {
    const lastReportedAt = new Date(Date.now() - seconds * 1000)

    return testApp.appModule.db
      .update(videoViews)
      .set({
        startedAt: sql`least(${videoViews.startedAt}, ${lastReportedAt.toISOString()}::timestamptz)`,
        lastReportedAt,
      })
      .where(eq(videoViews.id, viewId))
  }

  const reportProgress = (videoId: string, viewId: string, body: unknown) =>
    viewer.post(`${viewsPath(videoId)}/${viewId}/progress`, body)

  /** A view that watched `watchedSeconds` and got to `positionSeconds`. */
  const recordView = async (
    videoId: string,
    watchedSeconds: number,
    positionSeconds: number,
    options?: Parameters<typeof startView>[1]
  ) => {
    const viewId = await startViewId(videoId, options)

    await letTimePass(viewId, 60)
    await reportProgress(videoId, viewId, { watchedSeconds, positionSeconds })

    return viewId
  }

  const readLibraryAnalytics = async (query = "", client = memberClient) =>
    (await (await client.get(`${libraryPath}/analytics${query}`)).json()).data
      .analytics

  const readVideoAnalytics = async (videoId: string, query = "") =>
    (
      await (
        await memberClient.get(
          `${libraryPath}/videos/${videoId}/analytics${query}`
        )
      ).json()
    ).data.analytics

  describe("recording views", () => {
    it("starts a view when the player starts playing", async () => {
      const videoId = await createVideo("Launch")

      const response = await startView(videoId, {
        embeddingHost: "Blog.Example.com",
      })

      expect(response.status).toBe(201)
      expect((await response.json()).data.view).toEqual({
        id: expect.any(String),
        reportIntervalSeconds: 15,
      })
      expect(await readLibraryAnalytics()).toEqual(
        expect.objectContaining({
          totals: expect.objectContaining({ views: 1, watchSeconds: 0 }),
          embeddingHosts: [{ host: "blog.example.com", views: 1 }],
        })
      )
    })

    it.each(VIEWER_DEVICES)(
      "counts a $deviceType view from its user agent",
      async ({ userAgent, deviceType }) => {
        const videoId = await createVideo("Launch")

        await startView(videoId, { userAgent })

        expect((await readLibraryAnalytics()).devices).toEqual([
          { deviceType, views: 1 },
        ])
      }
    )

    it("does not count views of a video that is not processed yet", async () => {
      const videoId = await createVideo("Launch", { process: false })

      const response = await startView(videoId)

      expect(response.status).toBe(409)
    })

    it("applies the library's playback rules to new views", async () => {
      const videoId = await createVideo("Launch")
      await ownerClient.put(`${libraryPath}/security`, {
        allowedPlaybackHosts: ["videos.example.com"],
        requireSignedPlayback: false,
      })

      const elsewhere = await startView(videoId, {
        referer: "https://elsewhere.example.org/",
      })
      const allowed = await startView(videoId, {
        referer: "https://videos.example.com/watch",
      })

      expect([elsewhere.status, allowed.status]).toEqual([403, 201])
    })

    it("needs the embed URL's signature when the library requires signed playback", async () => {
      const videoId = await createVideo("Launch")
      await ownerClient.put(`${libraryPath}/security`, {
        allowedPlaybackHosts: [],
        requireSignedPlayback: true,
      })
      const signingClient = createLibraryApiClient(
        testApp,
        (
          await (
            await ownerClient.post(`${libraryPath}/api-keys`, {
              name: "Site",
              scopes: ["playback:sign"],
            })
          ).json()
        ).data.secret
      )
      const embedUrl = new URL(
        (
          await (
            await signingClient.post(
              `/libraries/${libraryId}/videos/${videoId}/playback-urls`,
              {}
            )
          ).json()
        ).data.playback.embedUrl
      )

      const unsigned = await startView(videoId)
      const signed = await startView(videoId, { query: embedUrl.search })

      expect([unsigned.status, signed.status]).toEqual([403, 201])
    })

    it("adds the reported watch time and the furthest position", async () => {
      const videoId = await createVideo("Launch")
      const viewId = await startViewId(videoId)

      await letTimePass(viewId, 30)
      const first = await reportProgress(videoId, viewId, {
        watchedSeconds: 1.5,
        positionSeconds: 2,
      })
      await letTimePass(viewId, 30)
      await reportProgress(videoId, viewId, {
        watchedSeconds: 0.5,
        positionSeconds: 1,
      })

      expect(first.status).toBe(200)
      expect((await readVideoAnalytics(videoId)).totals).toEqual({
        views: 1,
        watchSeconds: 2,
        averageViewSeconds: 2,
        averageCompletion: 2 / 3,
      })
    })

    it("counts no more watch time than could have played since the last report", async () => {
      const videoId = await createVideo("Launch")
      const viewId = await startViewId(videoId)

      await reportProgress(videoId, viewId, {
        watchedSeconds: 3600,
        positionSeconds: 999,
      })
      const { totals } = await readVideoAnalytics(videoId)

      // Under a second passed: at most 2 × that plus the 5-second grace.
      expect(totals.watchSeconds).toBeGreaterThan(4)
      expect(totals.watchSeconds).toBeLessThan(8)
      expect(totals.averageCompletion).toBe(1)
    })

    it("refuses reports for a view of another video, an unknown view and an expired one", async () => {
      const videoId = await createVideo("Launch")
      const otherVideoId = await createVideo("Teaser")
      const viewId = await startViewId(videoId)
      const expiredViewId = await startViewId(videoId)
      await testApp.appModule.db
        .update(videoViews)
        .set({ startedAt: new Date(Date.now() - 13 * 60 * 60 * 1000) })
        .where(eq(videoViews.id, expiredViewId))
      const report = { watchedSeconds: 1, positionSeconds: 1 }

      const responses = await Promise.all([
        reportProgress(otherVideoId, viewId, report),
        reportProgress(videoId, crypto.randomUUID(), report),
        reportProgress(videoId, expiredViewId, report),
        viewer.post(
          `${viewsPath(videoId, crypto.randomUUID())}/${viewId}/progress`,
          report
        ),
      ])

      expect(responses.map(({ status }) => status)).toEqual([
        404, 404, 404, 404,
      ])
      expect((await responses[1]!.json()).code).toBe("video.view.not_found")
    })

    it.each(INVALID_PROGRESS_REPORTS)(
      "rejects a report with $description",
      async ({ body }) => {
        const videoId = await createVideo("Launch")
        const viewId = await startViewId(videoId)

        const response = await reportProgress(videoId, viewId, body)

        expect(response.status).toBe(422)
      }
    )

    it("rejects an embedding host that is not a host name", async () => {
      const videoId = await createVideo("Launch")

      const response = await startView(videoId, {
        embeddingHost: "https://example.com/page",
      })

      expect(response.status).toBe(422)
    })
  })

  describe("reading analytics", () => {
    it("sums up the library's views, day by day and per video", async () => {
      const launchId = await createVideo("Launch")
      const teaserId = await createVideo("Teaser")
      await recordView(launchId, 3, 3, { embeddingHost: "blog.example.com" })
      await recordView(launchId, 1, 1.5, { embeddingHost: "blog.example.com" })
      await recordView(teaserId, 2, 3, { embeddingHost: "shop.example.com" })
      await startView(teaserId)

      const analytics = await readLibraryAnalytics("?days=7")
      const today = new Date().toISOString().slice(0, 10)

      expect(analytics.period).toEqual({
        days: 7,
        from: expect.any(String),
        to: expect.any(String),
      })
      expect(analytics.totals).toEqual({
        views: 4,
        watchSeconds: 6,
        averageViewSeconds: 1.5,
        averageCompletion: (1 + 0.5 + 1 + 0) / 4,
      })
      expect(analytics.daily).toHaveLength(7)
      expect(analytics.daily.at(-1)).toEqual({
        date: today,
        views: 4,
        watchSeconds: 6,
      })
      expect(analytics.daily[0]).toEqual(
        expect.objectContaining({ views: 0, watchSeconds: 0 })
      )
      expect(analytics.topVideos).toEqual([
        {
          videoId: launchId,
          title: "Launch",
          libraryId,
          libraryName: "Marketing",
          views: 2,
          watchSeconds: 4,
        },
        {
          videoId: teaserId,
          title: "Teaser",
          libraryId,
          libraryName: "Marketing",
          views: 2,
          watchSeconds: 2,
        },
      ])
      expect(analytics.embeddingHosts).toEqual([
        { host: "blog.example.com", views: 2 },
        { host: "shop.example.com", views: 1 },
      ])
    })

    it("reads the last 30 days unless asked otherwise, and leaves out older views", async () => {
      const videoId = await createVideo("Launch")
      const oldViewId = await startViewId(videoId)
      await startView(videoId)
      await testApp.appModule.db
        .update(videoViews)
        .set({ startedAt: new Date(Date.now() - 40 * DAY_MS) })
        .where(eq(videoViews.id, oldViewId))

      const defaults = await readLibraryAnalytics()
      const quarter = await readLibraryAnalytics("?days=90")

      expect(defaults.period.days).toBe(30)
      expect(defaults.totals.views).toBe(1)
      expect(quarter.totals.views).toBe(2)
    })

    it.each(INVALID_PERIODS)("rejects a period of %s days", async (days) => {
      const response = await memberClient.get(
        `${libraryPath}/analytics?days=${days}`
      )

      expect(response.status).toBe(422)
    })

    it("shows how many views reached each tenth of a video", async () => {
      const videoId = await createVideo("Launch")
      await startView(videoId)
      await recordView(videoId, 1.5, 1.5)
      await recordView(videoId, 3, 3)

      const { retention } = await readVideoAnalytics(videoId)

      expect(retention).toHaveLength(11)
      expect(retention[0]).toEqual({ percent: 0, views: 3 })
      expect(retention[5]).toEqual({ percent: 50, views: 2 })
      expect(retention[6]).toEqual({ percent: 60, views: 1 })
      expect(retention[10]).toEqual({ percent: 100, views: 1 })
    })

    it("shows how far views got through each chapter", async () => {
      const videoId = await createVideo("Launch")
      await memberClient.put(`${libraryPath}/videos/${videoId}/chapters`, {
        chapters: [
          { title: "Intro", startSeconds: 0 },
          { title: "Demo", startSeconds: 1 },
          { title: "Outro", startSeconds: 2 },
        ],
      })
      await startView(videoId)
      await recordView(videoId, 1.5, 1.5)
      await recordView(videoId, 3, 3)

      const { chapters } = await readVideoAnalytics(videoId)

      expect(chapters).toEqual([
        {
          title: "Intro",
          startSeconds: 0,
          endSeconds: 1,
          views: 3,
          completedViews: 2,
        },
        {
          title: "Demo",
          startSeconds: 1,
          endSeconds: 2,
          views: 2,
          completedViews: 1,
        },
        {
          title: "Outro",
          startSeconds: 2,
          endSeconds: 3,
          views: 1,
          completedViews: 1,
        },
      ])
    })

    it("shows no chapter figures for a video without chapters", async () => {
      const videoId = await createVideo("Launch")
      await recordView(videoId, 3, 3)

      expect((await readVideoAnalytics(videoId)).chapters).toEqual([])
    })

    it("keeps each library's views apart", async () => {
      const videoId = await createVideo("Launch")
      const otherLibraryId = (
        await (
          await ownerClient.post("/organizations/acme/libraries", {
            name: "Support",
          })
        ).json()
      ).data.library.id
      const otherPath = `/organizations/acme/libraries/${otherLibraryId}`
      const otherVideoId = await createVideo("Help", { path: otherPath })
      await startView(videoId)
      await viewer.post(viewsPath(otherVideoId, otherLibraryId), {})

      const analytics = await readLibraryAnalytics()
      const otherVideo = await memberClient.get(
        `${libraryPath}/videos/${otherVideoId}/analytics`
      )

      expect(analytics.totals.views).toBe(1)
      expect(otherVideo.status).toBe(404)
    })

    it("sums up every library of the organization on its dashboard", async () => {
      const launchId = await createVideo("Launch")
      const supportLibraryId = (
        await (
          await ownerClient.post("/organizations/acme/libraries", {
            name: "Support",
          })
        ).json()
      ).data.library.id
      const helpId = await createVideo("Help", {
        path: `/organizations/acme/libraries/${supportLibraryId}`,
      })
      await recordView(launchId, 2, 3)
      for (let index = 0; index < 2; index += 1) {
        await viewer.post(viewsPath(helpId, supportLibraryId), {})
      }

      const response = await memberClient.get(
        "/organizations/acme/analytics?days=7"
      )
      const { analytics } = (await response.json()).data

      expect(response.status).toBe(200)
      expect(analytics.totals).toEqual(
        expect.objectContaining({ views: 3, watchSeconds: 2 })
      )
      expect(analytics.daily).toHaveLength(7)
      expect(analytics.topLibraries).toEqual([
        {
          libraryId: supportLibraryId,
          name: "Support",
          views: 2,
          watchSeconds: 0,
        },
        { libraryId, name: "Marketing", views: 1, watchSeconds: 2 },
      ])
      expect(analytics.topVideos[0]).toEqual(
        expect.objectContaining({
          videoId: helpId,
          libraryId: supportLibraryId,
          libraryName: "Support",
        })
      )
      expect((await readLibraryAnalytics()).totals.views).toBe(1)
    })

    it("keeps each organization's dashboard to its own views", async () => {
      const videoId = await createVideo("Launch")
      await startView(videoId)
      const outsiderUser = await createUserFactory(testApp).create()
      await createOrganizationFactory(testApp)
        .ownedBy(outsiderUser)
        .create({ name: "Globex", slug: "globex" })
      const outsider = await signInAsUser(testApp, outsiderUser)

      const own = await outsider.get("/organizations/globex/analytics")
      const foreign = await outsider.get("/organizations/acme/analytics")

      expect((await own.json()).data.analytics.totals.views).toBe(0)
      expect(foreign.status).toBe(404)
    })

    it("keeps analytics from users outside the organization", async () => {
      const videoId = await createVideo("Launch")
      const outsider = await signInAsUser(
        testApp,
        await createUserFactory(testApp).create()
      )

      const responses = await Promise.all([
        outsider.get(`${libraryPath}/analytics`),
        outsider.get(`${libraryPath}/videos/${videoId}/analytics`),
      ])

      expect(responses.map(({ status }) => status)).toEqual([404, 404])
    })

    it("reads analytics through the library API with analytics:read", async () => {
      const videoId = await createVideo("Launch")
      await recordView(videoId, 2, 3)
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
      const analyticsKey = await createKey(["analytics:read"])
      const videosKey = await createKey(["videos:read"])

      const library = await analyticsKey.get(
        `/libraries/${libraryId}/analytics`
      )
      const video = await analyticsKey.get(
        `/libraries/${libraryId}/videos/${videoId}/analytics?days=7`
      )
      const missingScope = await videosKey.get(
        `/libraries/${libraryId}/analytics`
      )

      expect(library.status).toBe(200)
      expect((await library.json()).data.analytics.totals.views).toBe(1)
      expect((await video.json()).data.analytics).toEqual(
        expect.objectContaining({
          videoId,
          period: expect.objectContaining({ days: 7 }),
        })
      )
      expect(missingScope.status).toBe(403)
    })
  })
})
