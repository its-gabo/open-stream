import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { DEFAULT_LIBRARY_PLAYER_SETTINGS } from "@workspace/shared"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { fakeMediaToolkit } from "../../../test/helpers/fake-media-toolkit"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import { findVideoProcessingRequests } from "../../../test/helpers/outbox"
import { TEST_WEB_ORIGIN, createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { EMBEDDING_PAGES } from "./video-embed.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"

describe("Video embeds (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let viewer: ApiClient
  let libraryId: string
  let libraryPath: string

  beforeEach(async () => {
    testApp = await createTestApp({}, { mediaToolkit: fakeMediaToolkit })
    const owner = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .create({ name: "Acme", slug: "acme" })
    libraryId = (
      await createLibraryFactory(testApp)
        .inOrganization("acme", owner)
        .create({ name: "Marketing" })
    ).id
    libraryPath = `/organizations/acme/libraries/${libraryId}`
    ownerClient = await signInAsUser(testApp, owner)
    viewer = createLibraryApiClient(testApp)
  })

  afterEach(() => testApp.close())

  /** Uploads a video and, unless `process` is false, runs what the worker runs for it. */
  const createVideo = async ({ process = true } = {}) => {
    const { video } = (
      await (
        await ownerClient.post(`${libraryPath}/videos`, { title: "Launch" })
      ).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)

    await createTusClient(
      ownerClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "launch.mp4", bytes.byteLength)

    if (process) {
      const [request] = await findVideoProcessingRequests(testApp)

      await testApp.appModule.videoProcessingService.processVideo(request!, {
        isFinalAttempt: true,
      })
    }

    return video.id as string
  }

  const videoApiPath = (videoId: string) =>
    `/libraries/${libraryId}/videos/${videoId}`

  /** Asks for the embed as the web app's embed page does, passing on the framing page. */
  const readEmbed = (videoId: string, referer?: string, query = "") =>
    viewer.request(`${videoApiPath(videoId)}/embed${query}`, {
      headers: referer ? { referer } : {},
    })

  it("describes a processed video to the player", async () => {
    const videoId = await createVideo()
    const filesUrl = `${TEST_WEB_ORIGIN}/api/v1${videoApiPath(videoId)}`

    const response = await readEmbed(videoId)

    expect(response.status).toBe(200)
    expect((await response.json()).data.embed).toEqual({
      videoId,
      title: "Launch",
      durationSeconds: 3,
      width: 640,
      height: 360,
      hlsUrl: `${filesUrl}/hls/master.m3u8`,
      posterUrl: `${filesUrl}/thumbnails/poster.jpg`,
      storyboardUrl: `${filesUrl}/thumbnails/storyboard.vtt`,
      viewsUrl: `${filesUrl}/views`,
      chapters: [],
      allowedPlaybackHosts: [],
      player: DEFAULT_LIBRARY_PLAYER_SETTINGS,
    })
  })

  it("gives the player the library's look", async () => {
    const videoId = await createVideo()
    const player = {
      accentColor: "#e11d48",
      showTitle: false,
      showSettingsMenu: false,
      showPictureInPicture: false,
      showFullscreen: false,
      showChapters: false,
    }

    await ownerClient.put(`${libraryPath}/player`, player)
    const response = await readEmbed(videoId)

    expect((await response.json()).data.embed.player).toEqual(player)
  })

  it("answers with a conflict until the video is processed", async () => {
    const videoId = await createVideo({ process: false })

    const response = await readEmbed(videoId)

    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe("video.not_ready")
  })

  it("does not describe a video of another library", async () => {
    await createVideo()
    const response = await viewer.get(
      `/libraries/${crypto.randomUUID()}/videos/${crypto.randomUUID()}/embed`
    )

    expect(response.status).toBe(404)
  })

  describe("with allowed playback hosts", () => {
    let videoId: string

    beforeEach(async () => {
      videoId = await createVideo()
      await ownerClient.put(`${libraryPath}/security`, {
        allowedPlaybackHosts: ["videos.example.com"],
        requireSignedPlayback: false,
      })
    })

    it.each(EMBEDDING_PAGES)(
      "answers $status when framed by $description",
      async ({ referer, status }) => {
        const response = await readEmbed(videoId, referer)

        expect(response.status).toBe(status)
      }
    )

    it("names the hosts that may frame the player", async () => {
      const response = await readEmbed(
        videoId,
        "https://videos.example.com/watch"
      )

      expect((await response.json()).data.embed.allowedPlaybackHosts).toEqual([
        "videos.example.com",
      ])
    })

    it("plays the files for the player on the app's own origin", async () => {
      const fromEmbedPage = await viewer.request(
        `${videoApiPath(videoId)}/hls/master.m3u8`,
        {
          headers: {
            referer: `${TEST_WEB_ORIGIN}/embed/${libraryId}/${videoId}`,
          },
        }
      )
      const fromElsewhere = await viewer.request(
        `${videoApiPath(videoId)}/hls/master.m3u8`,
        { headers: { referer: "https://elsewhere.example.org/" } }
      )

      expect(fromEmbedPage.status).toBe(200)
      expect(fromElsewhere.status).toBe(403)
    })
  })

  describe("with signed playback", () => {
    let videoId: string
    let apiClient: ApiClient

    beforeEach(async () => {
      videoId = await createVideo()
      await ownerClient.put(`${libraryPath}/security`, {
        allowedPlaybackHosts: [],
        requireSignedPlayback: true,
      })
      apiClient = createLibraryApiClient(
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
    })

    const signEmbedUrl = async () =>
      new URL(
        (
          await (
            await apiClient.post(`${videoApiPath(videoId)}/playback-urls`, {})
          ).json()
        ).data.playback.embedUrl
      )

    it("signs an embed URL on the web app with the other playback URLs", async () => {
      const embedUrl = await signEmbedUrl()

      expect(embedUrl.origin).toBe(TEST_WEB_ORIGIN)
      expect(embedUrl.pathname).toBe(`/embed/${libraryId}/${videoId}`)
      expect([...embedUrl.searchParams.keys()]).toEqual([
        "key",
        "expires",
        "token",
      ])
    })

    it("needs the embed URL's signature and passes it on to the files", async () => {
      const embedUrl = await signEmbedUrl()

      const unsigned = await readEmbed(videoId)
      const signed = await readEmbed(videoId, undefined, embedUrl.search)
      const { embed } = (await signed.json()).data
      const master = await viewer.request(
        new URL(embed.hlsUrl).pathname.slice("/api/v1".length) +
          new URL(embed.hlsUrl).search
      )

      expect(unsigned.status).toBe(403)
      expect(signed.status).toBe(200)
      expect(new URL(embed.hlsUrl).search).toBe(embedUrl.search)
      expect(new URL(embed.posterUrl).search).toBe(embedUrl.search)
      expect(master.status).toBe(200)
    })
  })
})
