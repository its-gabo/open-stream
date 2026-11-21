import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { fakeMediaToolkit } from "../../../test/helpers/fake-media-toolkit"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import {
  findVideoProcessingRequests,
  runStorageCleanups,
} from "../../../test/helpers/outbox"
import { TEST_WEB_ORIGIN, createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { VIDEO_CAPTION_LIMITS } from "@workspace/shared"

import { API_BASE_PATH } from "../../common/http/http.constants"
import { videoCaptions, webhookDeliveries } from "../../db/schema"
import {
  ENGLISH_VTT,
  ENGLISH_VTT_STORED,
  INVALID_CAPTION_FILES,
  INVALID_UPLOAD_FIELDS,
  POLISH_SRT,
  VIDEO_DURATION_SECONDS,
} from "./captions.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { MediaToolkit } from "../../media/types/media.types"
import type { VideoCaptionDto } from "../dto/captions.schemas"

describe("Caption tracks (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let viewer: ApiClient
  let libraryId: string
  let libraryPath: string

  const mediaToolkit: MediaToolkit = {
    ...fakeMediaToolkit,
    probe: async (source) => {
      const probe = await fakeMediaToolkit.probe(source)

      return probe && { ...probe, durationSeconds: VIDEO_DURATION_SECONDS }
    },
  }

  beforeEach(async () => {
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
    viewer = createLibraryApiClient(testApp)
  })

  afterEach(() => testApp.close())

  /** Uploads a video and, unless `process` is false, runs what the worker runs for it. */
  const createVideo = async ({ process = true } = {}) => {
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

  const captionsPath = (videoId: string) =>
    `${libraryPath}/videos/${videoId}/captions`

  const toCaptionForm = (
    content: BlobPart,
    {
      language = "en",
      label = "English",
      kind = "subtitles",
      fileName = "captions.vtt",
    }: {
      language?: string
      label?: string
      kind?: string
      fileName?: string
    } = {}
  ) => {
    const form = new FormData()

    form.append("language", language)
    form.append("label", label)
    form.append("kind", kind)
    form.append("file", new File([content], fileName))

    return form
  }

  const uploadCaption = (
    client: ApiClient,
    path: string,
    ...form: Parameters<typeof toCaptionForm>
  ) =>
    client.request(path, { method: "POST", formData: toCaptionForm(...form) })

  const uploadEnglish = async (videoId: string) =>
    (
      await (
        await uploadCaption(memberClient, captionsPath(videoId), ENGLISH_VTT)
      ).json()
    ).data.caption as VideoCaptionDto

  const listCaptions = async (videoId: string) =>
    (await (await memberClient.get(captionsPath(videoId))).json()).data
      .captions as VideoCaptionDto[]

  const readActivities = async (videoId: string) =>
    (
      await (
        await ownerClient.get(
          `/organizations/acme/activity?resourceType=video&resourceId=${videoId}`
        )
      ).json()
    ).data.activities as ActivityLogDto[]

  const createApiKey = async (scopes: string[]) =>
    (
      await (
        await ownerClient.post(`${libraryPath}/api-keys`, {
          name: "Server",
          scopes,
        })
      ).json()
    ).data.secret as string

  const videoApiPath = (videoId: string) =>
    `/libraries/${libraryId}/videos/${videoId}`

  const toApiPath = (url: string) =>
    url.slice(`${TEST_WEB_ORIGIN}${API_BASE_PATH}`.length)

  describe("uploading tracks", () => {
    it("stores an uploaded WebVTT file, sanitized, as a track of the video", async () => {
      const videoId = await createVideo()

      const response = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        ENGLISH_VTT
      )
      const { caption } = (await response.json()).data
      const file = await memberClient.get(
        `${captionsPath(videoId)}/${caption.id}/file`
      )

      expect(response.status).toBe(201)
      expect(caption).toEqual({
        id: expect.any(String),
        videoId,
        language: "en",
        label: "English",
        kind: "subtitles",
        isDefault: false,
        source: "upload",
        transcriptionId: null,
        cueCount: 2,
        sizeBytes: new TextEncoder().encode(ENGLISH_VTT_STORED).byteLength,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(file.status).toBe(200)
      expect(file.headers.get("content-type")).toContain("text/vtt")
      expect(await file.text()).toBe(ENGLISH_VTT_STORED)
      expect(await listCaptions(videoId)).toEqual([caption])
      expect((await readActivities(videoId))[0]).toMatchObject({
        action: "video.caption_uploaded",
        context: expect.objectContaining({ captionId: caption.id }),
        after: {
          language: "en",
          label: "English",
          kind: "subtitles",
          isDefault: false,
          cueCount: 2,
        },
      })
    })

    it("turns an SRT file into WebVTT and keeps the language's usual case", async () => {
      const videoId = await createVideo()

      const response = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        POLISH_SRT,
        { language: "PL-pl", label: "Polski", fileName: "napisy.srt" }
      )
      const { caption } = (await response.json()).data
      const file = await memberClient.get(
        `${captionsPath(videoId)}/${caption.id}/file`
      )

      expect(response.status).toBe(201)
      expect(caption.language).toBe("pl-PL")
      expect(await file.text()).toBe(
        "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nCześć\n\n00:00:02.500 --> 00:00:04.000\nWitamy\n"
      )
    })

    it("replaces the track of the same language and kind, keeping its id", async () => {
      const videoId = await createVideo()
      const first = await uploadEnglish(videoId)

      const replaced = (
        await (
          await uploadCaption(
            memberClient,
            captionsPath(videoId),
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOnly one\n",
            { label: "English (edited)" }
          )
        ).json()
      ).data.caption
      const captions = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        ENGLISH_VTT,
        { kind: "captions", label: "English CC" }
      )

      expect(replaced).toMatchObject({
        id: first.id,
        label: "English (edited)",
        cueCount: 1,
      })
      expect(captions.status).toBe(201)
      expect((await listCaptions(videoId)).map(({ kind }) => kind)).toEqual([
        "subtitles",
        "captions",
      ])
      expect((await readActivities(videoId))[1]).toMatchObject({
        action: "video.caption_uploaded",
        before: { label: "English", cueCount: 2 },
        after: { label: "English (edited)", cueCount: 1 },
      })
    })

    it("writes a replacement to a new file and removes the old one once it is saved", async () => {
      const videoId = await createVideo()
      const location = testApp.appModule.defaultStorageLocation
      const captionKeys = () =>
        testApp.objectStorage
          .listObjectKeys(location)
          .filter((key) => key.includes("/captions/"))

      await uploadEnglish(videoId)
      const [firstKey] = captionKeys()

      await uploadCaption(
        memberClient,
        captionsPath(videoId),
        "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOnly one\n"
      )
      const keys = captionKeys()

      expect(keys).toHaveLength(1)
      expect(keys[0]).not.toBe(firstKey)
      expect(
        new TextDecoder().decode(
          testApp.objectStorage.readObject(location, keys[0]!)!
        )
      ).toContain("Only one")
    })

    it("keeps the saved track and its file when saving a replacement fails", async () => {
      const videoId = await createVideo()
      const location = testApp.appModule.defaultStorageLocation
      const captionKeys = () =>
        testApp.objectStorage
          .listObjectKeys(location)
          .filter((key) => key.includes("/captions/"))

      const first = await uploadEnglish(videoId)
      const before = captionKeys()
      const publishEvent = spyOn(
        testApp.appModule.webhookEventsService,
        "publishEvent"
      ).mockRejectedValueOnce(new Error("Database went away"))

      const response = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOnly one\n"
      )
      publishEvent.mockRestore()

      expect(response.status).toBe(500)
      expect(captionKeys()).toEqual(before)
      expect(
        new TextDecoder().decode(
          testApp.objectStorage.readObject(location, before[0]!)!
        )
      ).not.toContain("Only one")
      expect(await listCaptions(videoId)).toEqual([first])
    })

    for (const { name, content, status } of INVALID_CAPTION_FILES) {
      it(`refuses ${name}`, async () => {
        const videoId = await createVideo()

        const response = await uploadCaption(
          memberClient,
          captionsPath(videoId),
          content
        )

        expect(response.status).toBe(status)
        expect(await listCaptions(videoId)).toEqual([])
      })
    }

    it("refuses fields that are not valid", async () => {
      const videoId = await createVideo()

      const statuses = await Promise.all(
        INVALID_UPLOAD_FIELDS.map(
          async (fields) =>
            (
              await uploadCaption(
                memberClient,
                captionsPath(videoId),
                ENGLISH_VTT,
                fields
              )
            ).status
        )
      )

      expect(statuses).toEqual(INVALID_UPLOAD_FIELDS.map(() => 422))
    })

    it("refuses tracks for a video that is not processed", async () => {
      const videoId = await createVideo({ process: false })

      const response = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        ENGLISH_VTT
      )

      expect(response.status).toBe(409)
    })

    it("stops at the most tracks a video may have", async () => {
      const videoId = await createVideo()
      const languages = Array.from(
        { length: VIDEO_CAPTION_LIMITS.MAX_PER_VIDEO },
        (_, index) => `x${String.fromCharCode(97 + index)}`
      )

      for (const language of languages) {
        await uploadCaption(memberClient, captionsPath(videoId), ENGLISH_VTT, {
          language,
        })
      }

      const extra = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        ENGLISH_VTT,
        { language: "de" }
      )
      const replacing = await uploadCaption(
        memberClient,
        captionsPath(videoId),
        ENGLISH_VTT,
        { language: languages[0] }
      )

      expect(extra.status).toBe(409)
      expect(replacing.status).toBe(201)
    })

    it("tells the library's webhook about new tracks and deleted ones", async () => {
      const videoId = await createVideo()
      await ownerClient.put(`${libraryPath}/webhook`, {
        url: "https://hooks.example.com/openstream",
      })

      const caption = await uploadEnglish(videoId)
      await memberClient.delete(`${captionsPath(videoId)}/${caption.id}`)
      const deliveries = await testApp.appModule.db
        .select()
        .from(webhookDeliveries)

      expect(
        deliveries
          .filter(({ eventType }) => eventType.startsWith("video.caption"))
          .map(({ eventType, payload }) => [eventType, payload.data])
      ).toEqual([
        ["video.caption.ready", caption],
        ["video.caption.deleted", caption],
      ])
    })
  })

  describe("managing tracks", () => {
    it("makes one track the default at a time", async () => {
      const videoId = await createVideo()
      const english = await uploadEnglish(videoId)
      const polish = (
        await (
          await uploadCaption(memberClient, captionsPath(videoId), POLISH_SRT, {
            language: "pl",
            label: "Polski",
          })
        ).json()
      ).data.caption

      await memberClient.put(`${captionsPath(videoId)}/${english.id}`, {
        label: "English",
        isDefault: true,
      })
      const response = await memberClient.put(
        `${captionsPath(videoId)}/${polish.id}`,
        { label: "Polish", isDefault: true }
      )

      expect(response.status).toBe(200)
      expect(
        (await listCaptions(videoId)).map(({ label, isDefault }) => [
          label,
          isDefault,
        ])
      ).toEqual([
        ["English", false],
        ["Polish", true],
      ])
      expect((await readActivities(videoId))[0]).toMatchObject({
        action: "video.caption_updated",
        before: { label: "Polski", isDefault: false },
        after: { label: "Polish", isDefault: true },
      })
    })

    it("records nothing when a track's fields stay the same", async () => {
      const videoId = await createVideo()
      const caption = await uploadEnglish(videoId)

      await memberClient.put(`${captionsPath(videoId)}/${caption.id}`, {
        label: "English",
        isDefault: false,
      })

      expect((await readActivities(videoId))[0]?.action).toBe(
        "video.caption_uploaded"
      )
    })

    it("deletes a track with its file", async () => {
      const videoId = await createVideo()
      const caption = await uploadEnglish(videoId)
      const location = testApp.appModule.defaultStorageLocation
      const captionKeys = () =>
        testApp.objectStorage
          .listObjectKeys(location)
          .filter((key) => key.includes("/captions/"))

      const before = captionKeys()
      const response = await memberClient.delete(
        `${captionsPath(videoId)}/${caption.id}`
      )
      const again = await memberClient.delete(
        `${captionsPath(videoId)}/${caption.id}`
      )

      expect(before).toHaveLength(1)
      expect(response.status).toBe(200)
      expect(again.status).toBe(404)
      expect(captionKeys()).toEqual([])
      expect((await readActivities(videoId))[0]).toMatchObject({
        action: "video.caption_deleted",
        before: expect.objectContaining({ language: "en" }),
      })
    })

    it("removes the tracks' files with the video", async () => {
      const videoId = await createVideo()
      await uploadEnglish(videoId)

      await memberClient.delete(`${libraryPath}/videos/${videoId}`)
      await runStorageCleanups(testApp)

      expect(
        testApp.objectStorage
          .listObjectKeys(testApp.appModule.defaultStorageLocation)
          .filter((key) => key.includes("/captions/"))
      ).toEqual([])
      expect(await testApp.appModule.db.select().from(videoCaptions)).toEqual(
        []
      )
    })

    it("does not find tracks of another library's video", async () => {
      const videoId = await createVideo()
      const caption = await uploadEnglish(videoId)
      const otherLibraryId = (
        await (
          await ownerClient.post("/organizations/acme/libraries", {
            name: "Other",
          })
        ).json()
      ).data.library.id
      const otherPath = `/organizations/acme/libraries/${otherLibraryId}/videos/${videoId}/captions`

      const responses = await Promise.all([
        memberClient.get(otherPath),
        memberClient.get(`${otherPath}/${caption.id}/file`),
        memberClient.delete(`${otherPath}/${caption.id}`),
      ])

      expect(responses.map(({ status }) => status)).toEqual([404, 404, 404])
    })
  })

  describe("library API", () => {
    it("lists tracks with `videos:read` and changes them with `videos:manage`", async () => {
      const videoId = await createVideo()
      const reader = createLibraryApiClient(
        testApp,
        await createApiKey(["videos:read"])
      )
      const manager = createLibraryApiClient(
        testApp,
        await createApiKey(["videos:manage"])
      )
      const path = `${videoApiPath(videoId)}/captions`

      const refused = await uploadCaption(reader, path, ENGLISH_VTT)
      const uploaded = await uploadCaption(manager, path, ENGLISH_VTT)
      const { caption } = (await uploaded.json()).data
      const listed = await reader.get(path)
      const updated = await manager.put(`${path}/${caption.id}`, {
        label: "English",
        isDefault: true,
      })
      const deleted = await manager.delete(`${path}/${caption.id}`)

      expect(refused.status).toBe(403)
      expect(uploaded.status).toBe(201)
      expect((await listed.json()).data.captions).toEqual([caption])
      expect((await updated.json()).data.caption.isDefault).toBe(true)
      expect(deleted.status).toBe(200)
      expect((await readActivities(videoId))[0]).toMatchObject({
        action: "video.caption_deleted",
        actor: expect.objectContaining({ kind: "api_key" }),
      })
    })
  })

  describe("playing tracks", () => {
    it("gives players the tracks with a WebVTT URL each", async () => {
      const videoId = await createVideo()
      const caption = await uploadEnglish(videoId)
      const { embed } = (
        await (await viewer.get(`${videoApiPath(videoId)}/embed`)).json()
      ).data

      const response = await viewer.request(toApiPath(embed.captionsUrl))
      const { captions } = (await response.json()).data
      const file = await viewer.request(toApiPath(captions[0].url))

      expect(response.status).toBe(200)
      expect(captions).toEqual([
        {
          id: caption.id,
          language: "en",
          label: "English",
          kind: "subtitles",
          isDefault: false,
          url: `${TEST_WEB_ORIGIN}${API_BASE_PATH}${videoApiPath(videoId)}/captions/${caption.id}.vtt`,
        },
      ])
      expect(file.status).toBe(200)
      expect(file.headers.get("access-control-allow-origin")).toBe("*")
      expect(await file.text()).toBe(ENGLISH_VTT_STORED)
    })

    it("signs the track URLs of a library that signs playback", async () => {
      const videoId = await createVideo()
      await uploadEnglish(videoId)
      const signer = createLibraryApiClient(
        testApp,
        await createApiKey(["playback:sign"])
      )
      await ownerClient.put(`${libraryPath}/security`, {
        allowedPlaybackHosts: [],
        requireSignedPlayback: true,
      })
      const { playback } = (
        await (
          await signer.post(`${videoApiPath(videoId)}/playback-urls`, {
            expiresInSeconds: 600,
          })
        ).json()
      ).data

      const unsigned = await viewer.get(
        `${videoApiPath(videoId)}/embed/captions`
      )
      const signed = await viewer.request(toApiPath(playback.captionsUrl))
      const [track] = (await signed.json()).data.captions
      const file = await viewer.request(toApiPath(track.url))
      const unsignedFile = await viewer.request(
        toApiPath(track.url).split("?")[0]!
      )

      expect(unsigned.status).toBe(403)
      expect(signed.status).toBe(200)
      expect(new URL(track.url).searchParams.get("token")).toBeTruthy()
      expect(file.status).toBe(200)
      expect(unsignedFile.status).toBe(403)
    })

    it("does not serve a track of another video, or a file name that is not a track", async () => {
      const videoId = await createVideo()
      const otherVideoId = await createVideo()
      const caption = await uploadEnglish(videoId)

      const responses = await Promise.all([
        viewer.get(`${videoApiPath(otherVideoId)}/captions/${caption.id}.vtt`),
        viewer.get(`${videoApiPath(videoId)}/captions/${caption.id}`),
        viewer.get(`${videoApiPath(videoId)}/captions/..%2F..%2Fsource`),
      ])

      expect(responses.map(({ status }) => status)).toEqual([404, 422, 422])
    })

    it("refuses the tracks of a video that is not processed", async () => {
      const videoId = await createVideo({ process: false })

      const response = await viewer.get(
        `${videoApiPath(videoId)}/embed/captions`
      )

      expect(response.status).toBe(409)
    })
  })
})
