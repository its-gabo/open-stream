import { afterEach, beforeEach, describe, expect, it } from "bun:test"

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
import {
  INVALID_PLAYLIST_BODIES,
  INVALID_VIDEO_LISTS,
} from "./playlists.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { PlaylistDto, PlaylistEmbedDto } from "../dto/playlists.schemas"

describe("Playlists (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let viewer: ApiClient
  let libraryId: string
  let libraryPath: string
  let otherLibraryPath: string

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
        .create({ name: "Courses" })
    ).id
    libraryPath = `/organizations/acme/libraries/${libraryId}`
    otherLibraryPath = `/organizations/acme/libraries/${
      (
        await createLibraryFactory(testApp)
          .inOrganization("acme", owner)
          .create({ name: "Marketing" })
      ).id
    }`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
    viewer = createLibraryApiClient(testApp)
  })

  afterEach(() => testApp.close())

  /** Uploads a video and, unless `process` is false, runs what the worker runs for it. */
  const createVideo = async (
    title: string,
    { process = true, path = libraryPath } = {}
  ) => {
    const { video } = (
      await (await memberClient.post(`${path}/videos`, { title })).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)

    await createTusClient(memberClient, `${path}/videos/${video.id}`).upload(
      bytes,
      "lesson.mp4",
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

  const createPlaylist = async (body: Record<string, unknown>) => {
    const response = await memberClient.post(`${libraryPath}/playlists`, body)

    return (await response.json()).data.playlist as PlaylistDto
  }

  const readPlaylist = async (playlistId: string): Promise<PlaylistDto> =>
    (
      await (
        await memberClient.get(`${libraryPath}/playlists/${playlistId}`)
      ).json()
    ).data.playlist

  const videoIdsOf = (playlist: { videos: { id: string }[] }) =>
    playlist.videos.map(({ id }) => id)

  const readActivities = async (playlistId: string) =>
    (
      await (
        await ownerClient.get(
          `/organizations/acme/activity?resourceType=playlist&resourceId=${playlistId}`
        )
      ).json()
    ).data.activities as ActivityLogDto[]

  const createApiKey = async (scopes: string[]) =>
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

  const playlistApiPath = (playlistId: string) =>
    `/libraries/${libraryId}/playlists/${playlistId}`

  /** Asks for the embed as the web app's embed page does, passing on the framing page. */
  const readEmbed = (playlistId: string, { referer = "", query = "" } = {}) =>
    viewer.request(`${playlistApiPath(playlistId)}/embed${query}`, {
      headers: referer ? { referer } : {},
    })

  /** Requests a URL the embed handed out, as the player in the browser would. */
  const fetchPlayerUrl = (url: string) =>
    viewer.get(
      new URL(url).pathname.slice("/api/v1".length) + new URL(url).search
    )

  describe("managing", () => {
    it("creates a playlist with videos in the given order", async () => {
      const first = await createVideo("Lesson 1")
      const second = await createVideo("Lesson 2")

      const response = await memberClient.post(`${libraryPath}/playlists`, {
        title: " Basics ",
        description: "Start here.",
        videoIds: [second, first],
      })
      const { playlist } = (await response.json()).data

      expect(response.status).toBe(201)
      expect(playlist).toMatchObject({
        libraryId,
        title: "Basics",
        description: "Start here.",
        videoCount: 2,
        durationSeconds: 6,
      })
      expect(videoIdsOf(playlist)).toEqual([second, first])
    })

    it("creates an empty playlist without a description", async () => {
      const response = await memberClient.post(`${libraryPath}/playlists`, {
        title: "Later",
        description: "",
      })

      expect(response.status).toBe(201)
      expect((await response.json()).data.playlist).toMatchObject({
        description: null,
        videoCount: 0,
        durationSeconds: 0,
        videos: [],
      })
    })

    it.each(INVALID_PLAYLIST_BODIES)(
      "refuses $description",
      async ({ body }) => {
        const response = await memberClient.post(
          `${libraryPath}/playlists`,
          body
        )

        expect(response.status).toBe(422)
      }
    )

    it("lists the library's playlists newest first, with their videos counted", async () => {
      const video = await createVideo("Lesson 1")
      const draft = await createVideo("Lesson 2", { process: false })
      await createPlaylist({ title: "First" })
      await createPlaylist({ title: "Second", videoIds: [video, draft] })

      const response = await memberClient.get(`${libraryPath}/playlists`)
      const { playlists } = (await response.json()).data

      expect(response.status).toBe(200)
      expect(playlists).toEqual([
        expect.objectContaining({
          title: "Second",
          videoCount: 2,
          durationSeconds: 3,
        }),
        expect.objectContaining({ title: "First", videoCount: 0 }),
      ])
    })

    it("changes the title and description, and keeps what is not sent", async () => {
      const playlist = await createPlaylist({
        title: "Basics",
        description: "Start here.",
      })

      const renamed = await memberClient.patch(
        `${libraryPath}/playlists/${playlist.id}`,
        { title: "Getting started" }
      )
      await memberClient.patch(`${libraryPath}/playlists/${playlist.id}`, {
        description: null,
      })

      expect(renamed.status).toBe(200)
      expect(await readPlaylist(playlist.id)).toMatchObject({
        title: "Getting started",
        description: null,
      })
    })

    it("replaces the videos, keeping the new order", async () => {
      const [first, second, third] = [
        await createVideo("Lesson 1"),
        await createVideo("Lesson 2"),
        await createVideo("Lesson 3"),
      ]
      const playlist = await createPlaylist({
        title: "Basics",
        videoIds: [first, second],
      })

      const response = await memberClient.put(
        `${libraryPath}/playlists/${playlist.id}/videos`,
        { videoIds: [third, first] }
      )

      expect(response.status).toBe(200)
      expect(videoIdsOf((await response.json()).data.playlist)).toEqual([
        third,
        first,
      ])
      expect(videoIdsOf(await readPlaylist(playlist.id))).toEqual([
        third,
        first,
      ])
    })

    it("removes every video when given an empty list", async () => {
      const video = await createVideo("Lesson 1")
      const playlist = await createPlaylist({
        title: "Basics",
        videoIds: [video],
      })

      await memberClient.put(`${libraryPath}/playlists/${playlist.id}/videos`, {
        videoIds: [],
      })

      expect((await readPlaylist(playlist.id)).videos).toEqual([])
    })

    it.each(INVALID_VIDEO_LISTS)(
      "refuses $description",
      async ({ videoIds }) => {
        const playlist = await createPlaylist({ title: "Basics" })

        const response = await memberClient.put(
          `${libraryPath}/playlists/${playlist.id}/videos`,
          { videoIds }
        )

        expect(response.status).toBe(422)
      }
    )

    it("refuses a video of another library and keeps the videos it had", async () => {
      const own = await createVideo("Lesson 1")
      const foreign = await createVideo("Teaser", { path: otherLibraryPath })
      const playlist = await createPlaylist({
        title: "Basics",
        videoIds: [own],
      })

      const response = await memberClient.put(
        `${libraryPath}/playlists/${playlist.id}/videos`,
        { videoIds: [own, foreign] }
      )

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe("playlist.video_not_in_library")
      expect(videoIdsOf(await readPlaylist(playlist.id))).toEqual([own])
    })

    it("drops a deleted video from its playlists", async () => {
      const [first, second] = [
        await createVideo("Lesson 1"),
        await createVideo("Lesson 2"),
      ]
      const playlist = await createPlaylist({
        title: "Basics",
        videoIds: [first, second],
      })

      await memberClient.delete(`${libraryPath}/videos/${first}`)

      expect(videoIdsOf(await readPlaylist(playlist.id))).toEqual([second])
    })

    it("deletes a playlist and keeps its videos", async () => {
      const video = await createVideo("Lesson 1")
      const playlist = await createPlaylist({
        title: "Basics",
        videoIds: [video],
      })

      const response = await memberClient.delete(
        `${libraryPath}/playlists/${playlist.id}`
      )

      expect(response.status).toBe(200)
      expect(
        (await memberClient.get(`${libraryPath}/playlists/${playlist.id}`))
          .status
      ).toBe(404)
      expect(
        (await memberClient.get(`${libraryPath}/videos/${video}`)).status
      ).toBe(200)
    })
  })

  describe("activity", () => {
    it("records each change with what changed", async () => {
      const video = await createVideo("Lesson 1")
      const playlist = await createPlaylist({ title: "Basics" })

      await memberClient.patch(`${libraryPath}/playlists/${playlist.id}`, {
        title: "Getting started",
      })
      await memberClient.put(`${libraryPath}/playlists/${playlist.id}/videos`, {
        videoIds: [video],
      })
      await memberClient.delete(`${libraryPath}/playlists/${playlist.id}`)

      expect(
        (await readActivities(playlist.id)).map(
          ({ action, before, after, context }) => ({
            action,
            before,
            after,
            context,
          })
        )
      ).toEqual([
        {
          action: "playlist.deleted",
          before: { title: "Getting started", description: null },
          after: null,
          context: { libraryId, libraryName: "Courses" },
        },
        {
          action: "playlist.videos_updated",
          before: { videoIds: [] },
          after: { videoIds: [video] },
          context: { libraryId, libraryName: "Courses" },
        },
        {
          action: "playlist.updated",
          before: { title: "Basics" },
          after: { title: "Getting started" },
          context: { libraryId, libraryName: "Courses" },
        },
        {
          action: "playlist.created",
          before: null,
          after: { title: "Basics", description: null, videoIds: [] },
          context: { libraryId, libraryName: "Courses" },
        },
      ])
    })

    it("records nothing when the same details and videos are saved again", async () => {
      const video = await createVideo("Lesson 1")
      const playlist = await createPlaylist({
        title: "Basics",
        videoIds: [video],
      })

      const renamed = await memberClient.patch(
        `${libraryPath}/playlists/${playlist.id}`,
        { title: "Basics" }
      )
      const reordered = await memberClient.put(
        `${libraryPath}/playlists/${playlist.id}/videos`,
        { videoIds: [video] }
      )

      expect(renamed.status).toBe(200)
      expect(reordered.status).toBe(200)
      expect(
        (await readActivities(playlist.id)).map(({ action }) => action)
      ).toEqual(["playlist.created"])
    })
  })

  describe("access", () => {
    it("keeps other organizations' members away from the playlists", async () => {
      const playlist = await createPlaylist({ title: "Basics" })
      const outsider = await createUserFactory(testApp).create()
      await createOrganizationFactory(testApp)
        .ownedBy(outsider)
        .create({ name: "Other", slug: "other" })
      const outsiderClient = await signInAsUser(testApp, outsider)

      const read = await outsiderClient.get(
        `${libraryPath}/playlists/${playlist.id}`
      )
      const deleted = await outsiderClient.delete(
        `${libraryPath}/playlists/${playlist.id}`
      )

      expect(read.status).toBe(404)
      expect(deleted.status).toBe(404)
      expect((await readPlaylist(playlist.id)).title).toBe("Basics")
    })

    it("does not find a playlist through another library", async () => {
      const playlist = await createPlaylist({ title: "Basics" })

      const response = await memberClient.get(
        `${otherLibraryPath}/playlists/${playlist.id}`
      )

      expect(response.status).toBe(404)
      expect((await response.json()).code).toBe("playlist.not_found")
    })

    it("lets the library API read playlists with videos:read and change them with videos:manage", async () => {
      const video = await createVideo("Lesson 1")
      const reading = await createApiKey(["videos:read"])
      const managing = await createApiKey(["videos:manage"])

      const refused = await reading.post(`/libraries/${libraryId}/playlists`, {
        title: "Basics",
      })
      const created = await managing.post(`/libraries/${libraryId}/playlists`, {
        title: "Basics",
        videoIds: [video],
      })
      const { playlist } = (await created.json()).data
      const listed = await reading.get(`/libraries/${libraryId}/playlists`)
      const read = await reading.get(playlistApiPath(playlist.id))
      const updated = await managing.patch(playlistApiPath(playlist.id), {
        description: "Start here.",
      })
      const emptied = await managing.put(
        `${playlistApiPath(playlist.id)}/videos`,
        { videoIds: [] }
      )
      const deleted = await managing.delete(playlistApiPath(playlist.id))

      expect(refused.status).toBe(403)
      expect(created.status).toBe(201)
      expect((await listed.json()).data.playlists).toHaveLength(1)
      expect(videoIdsOf((await read.json()).data.playlist)).toEqual([video])
      expect((await updated.json()).data.playlist.description).toBe(
        "Start here."
      )
      expect((await emptied.json()).data.playlist.videos).toEqual([])
      expect(deleted.status).toBe(200)
    })
  })

  describe("embedding", () => {
    it("gives the player the processed videos in order, with their own URLs", async () => {
      const first = await createVideo("Lesson 1")
      const draft = await createVideo("Lesson 2", { process: false })
      const third = await createVideo("Lesson 3")
      await memberClient.patch(`${libraryPath}/videos/${third}`, {
        description: "The last one.",
      })
      const playlist = await createPlaylist({
        title: "Basics",
        description: "Start here.",
        videoIds: [third, draft, first],
      })

      const response = await readEmbed(playlist.id)
      const embed: PlaylistEmbedDto = (await response.json()).data.embed
      const filesUrl = `${TEST_WEB_ORIGIN}/api/v1/libraries/${libraryId}/videos/${third}`

      expect(response.status).toBe(200)
      expect(embed).toMatchObject({
        playlistId: playlist.id,
        title: "Basics",
        description: "Start here.",
        allowedPlaybackHosts: [],
      })
      expect(embed.videos.map(({ videoId }) => videoId)).toEqual([third, first])
      expect(embed.videos[0]).toMatchObject({
        title: "Lesson 3",
        description: "The last one.",
        durationSeconds: 3,
        hlsUrl: `${filesUrl}/hls/master.m3u8`,
        viewsUrl: `${filesUrl}/views`,
      })
    })

    it("applies the library's host rules", async () => {
      const playlist = await createPlaylist({ title: "Basics" })
      await ownerClient.put(`${libraryPath}/security`, {
        allowedPlaybackHosts: ["courses.example.com"],
        requireSignedPlayback: false,
      })

      const allowed = await readEmbed(playlist.id, {
        referer: "https://courses.example.com/basics",
      })
      const refused = await readEmbed(playlist.id, {
        referer: "https://elsewhere.example.org/",
      })

      expect(allowed.status).toBe(200)
      expect(refused.status).toBe(403)
    })

    it("does not find a playlist of another library", async () => {
      const playlist = await createPlaylist({ title: "Basics" })
      const otherLibraryId = otherLibraryPath.split("/").at(-1)

      const response = await viewer.get(
        `/libraries/${otherLibraryId}/playlists/${playlist.id}/embed`
      )

      expect(response.status).toBe(404)
    })

    describe("with signed playback", () => {
      let first: string
      let second: string
      let playlistId: string
      let signer: ApiClient

      beforeEach(async () => {
        first = await createVideo("Lesson 1")
        second = await createVideo("Lesson 2")
        playlistId = (
          await createPlaylist({ title: "Basics", videoIds: [first, second] })
        ).id
        await ownerClient.put(`${libraryPath}/security`, {
          allowedPlaybackHosts: [],
          requireSignedPlayback: true,
        })
        signer = await createApiKey(["playback:sign"])
      })

      const signEmbedUrl = async () =>
        new URL(
          (
            await (
              await signer.post(
                `${playlistApiPath(playlistId)}/playback-urls`,
                {}
              )
            ).json()
          ).data.playback.embedUrl
        )

      it("signs an embed URL for the playlist on the web app", async () => {
        const embedUrl = await signEmbedUrl()

        expect(embedUrl.origin).toBe(TEST_WEB_ORIGIN)
        expect(embedUrl.pathname).toBe(
          `/embed/${libraryId}/playlists/${playlistId}`
        )
        expect([...embedUrl.searchParams.keys()]).toEqual([
          "key",
          "expires",
          "token",
        ])
      })

      it("needs the signature and signs each video's files on its own", async () => {
        const embedUrl = await signEmbedUrl()

        const unsigned = await readEmbed(playlistId)
        const signed = await readEmbed(playlistId, { query: embedUrl.search })
        const embed: PlaylistEmbedDto = (await signed.json()).data.embed
        const [firstVideo, secondVideo] = embed.videos

        expect(unsigned.status).toBe(403)
        expect(signed.status).toBe(200)
        expect(new URL(firstVideo!.hlsUrl).searchParams.get("token")).not.toBe(
          new URL(secondVideo!.hlsUrl).searchParams.get("token")
        )
        expect((await fetchPlayerUrl(firstVideo!.hlsUrl)).status).toBe(200)
        expect((await fetchPlayerUrl(secondVideo!.posterUrl)).status).toBe(200)
      })

      it("does not take a playlist's signature for one of its videos", async () => {
        const embedUrl = await signEmbedUrl()

        const response = await viewer.get(
          `/libraries/${libraryId}/videos/${first}/embed${embedUrl.search}`
        )

        expect(response.status).toBe(403)
      })

      it("needs playback:sign to sign a playlist", async () => {
        const reading = await createApiKey(["videos:read"])

        const response = await reading.post(
          `${playlistApiPath(playlistId)}/playback-urls`,
          {}
        )

        expect(response.status).toBe(403)
      })
    })
  })
})
