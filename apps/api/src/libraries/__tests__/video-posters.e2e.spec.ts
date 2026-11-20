import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { VIDEO_POSTER_IMAGE_LIMITS } from "@workspace/shared"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { fakeMediaToolkit } from "../../../test/helpers/fake-media-toolkit"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import {
  HAS_FFMPEG,
  createTestMediaFile,
} from "../../../test/helpers/media-files"
import {
  findVideoProcessingRequests,
  runStorageCleanups,
} from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"

import { webhookDeliveries } from "../../db/schema"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { MediaToolkit } from "../../media/types/media.types"
import type { VideoDto } from "../dto/libraries.schemas"

const PNG_BYTES = createFileBytes(VIDEO_FILE_HEADERS.PNG, 2048)

/** Like the fake toolkit, but each poster says which frame or image it was made from. */
const labellingMediaToolkit: MediaToolkit = {
  ...fakeMediaToolkit,
  captureImage: async ({ outputPath, atSeconds }) => {
    await Bun.write(outputPath, `frame@${atSeconds}`)
  },
  convertImage: async ({ source, outputPath }) => {
    await Bun.write(outputPath, `image of ${Bun.file(source).size} bytes`)
  },
}

const imageForm = (bytes: Uint8Array<ArrayBuffer>, type = "image/png") => {
  const form = new FormData()

  form.append("image", new File([bytes], "poster.png", { type }))

  return form
}

describe("Video posters (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let libraryId: string
  let libraryPath: string

  const setUp = async (app: TestApp) => {
    testApp = app
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
  }

  afterEach(() => testApp.close())

  /** Creates a video and uploads `bytes` as its file in one tus request. */
  const uploadVideo = async (bytes: Uint8Array<ArrayBuffer>) => {
    const { video } = (
      await (
        await memberClient.post(`${libraryPath}/videos`, { title: "Clip" })
      ).json()
    ).data

    await createTusClient(
      memberClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "clip.mp4", bytes.byteLength)

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

  const uploadProcessedVideo = async () => {
    const videoId = await uploadVideo(
      createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
    )

    await processVideo(videoId)

    return videoId
  }

  const readVideo = async (videoId: string): Promise<VideoDto> =>
    (await (await memberClient.get(`${libraryPath}/videos/${videoId}`)).json())
      .data.video

  const readPoster = async (videoId: string) =>
    (
      await memberClient.get(`${libraryPath}/videos/${videoId}/poster.jpg`)
    ).text()

  const putPoster = (videoId: string, body: unknown) =>
    memberClient.put(`${libraryPath}/videos/${videoId}/poster`, body)

  const putPosterImage = (videoId: string, form: FormData) =>
    memberClient.request(`${libraryPath}/videos/${videoId}/poster/image`, {
      method: "PUT",
      formData: form,
    })

  const storedKeys = () =>
    testApp.objectStorage.listObjectKeys(
      testApp.appModule.defaultStorageLocation
    )

  describe("without ffmpeg", () => {
    beforeEach(async () =>
      setUp(await createTestApp({}, { mediaToolkit: labellingMediaToolkit }))
    )

    it("picks a poster automatically when a video is processed", async () => {
      const videoId = await uploadProcessedVideo()

      expect((await readVideo(videoId)).poster).toEqual({
        source: "automatic",
        frameSeconds: null,
        updatedAt: expect.any(String),
      })
      expect(await readPoster(videoId)).toBe("frame@0.30000000000000004")
    })

    it("takes the poster from the frame a member chose", async () => {
      const videoId = await uploadProcessedVideo()
      const before = await readVideo(videoId)

      const response = await putPoster(videoId, {
        source: "frame",
        atSeconds: 2,
      })
      const { video } = (await response.json()).data

      expect(response.status).toBe(200)
      expect(video.poster).toEqual({
        source: "frame",
        frameSeconds: 2,
        updatedAt: expect.any(String),
      })
      expect(Date.parse(video.poster.updatedAt)).toBeGreaterThan(
        Date.parse(before.poster.updatedAt!)
      )
      expect(await readPoster(videoId)).toBe("frame@2")
    })

    it("refuses a frame past the end of the video", async () => {
      const videoId = await uploadProcessedVideo()

      const response = await putPoster(videoId, {
        source: "frame",
        atSeconds: 3.5,
      })

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe(
        "video.poster.frame_out_of_range"
      )
      expect(await readPoster(videoId)).toBe("frame@0.30000000000000004")
    })

    it("refuses a frame without its time or with a negative one", async () => {
      const videoId = await uploadProcessedVideo()

      expect((await putPoster(videoId, { source: "frame" })).status).toBe(422)
      expect(
        (await putPoster(videoId, { source: "frame", atSeconds: -1 })).status
      ).toBe(422)
      expect((await putPoster(videoId, { source: "image" })).status).toBe(422)
    })

    it("refuses to change the poster of a video that is not processed", async () => {
      const videoId = await uploadVideo(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
      )

      const response = await putPoster(videoId, {
        source: "frame",
        atSeconds: 1,
      })

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe("video.not_ready")
    })

    it("keeps the chosen frame when the video is processed again", async () => {
      const videoId = await uploadProcessedVideo()

      await putPoster(videoId, { source: "frame", atSeconds: 2.5 })
      await memberClient.post(`${libraryPath}/videos/${videoId}/reprocess`)
      await processVideo(videoId)

      expect((await readVideo(videoId)).poster.source).toBe("frame")
      expect(await readPoster(videoId)).toBe("frame@2.5")
    })

    it("makes an uploaded image the poster and keeps it through processing", async () => {
      const videoId = await uploadProcessedVideo()

      const response = await putPosterImage(videoId, imageForm(PNG_BYTES))
      await memberClient.post(`${libraryPath}/videos/${videoId}/reprocess`)
      await processVideo(videoId)

      expect(response.status).toBe(200)
      expect((await response.json()).data.video.poster).toEqual({
        source: "image",
        frameSeconds: null,
        updatedAt: expect.any(String),
      })
      expect(await readPoster(videoId)).toBe("image of 2048 bytes")
      expect(storedKeys()).toEqual(
        expect.arrayContaining([expect.stringMatching(/\/poster-image\.jpg$/)])
      )
    })

    it("judges an image by its bytes, not its stated type", async () => {
      const videoId = await uploadProcessedVideo()

      const response = await putPosterImage(
        videoId,
        imageForm(createFileBytes(VIDEO_FILE_HEADERS.TEXT, 512))
      )

      expect(response.status).toBe(415)
      expect((await response.json()).code).toBe(
        "video.poster.unsupported_image"
      )
    })

    it("refuses an image above the size limit", async () => {
      const videoId = await uploadProcessedVideo()

      const response = await putPosterImage(
        videoId,
        imageForm(
          createFileBytes(
            VIDEO_FILE_HEADERS.PNG,
            VIDEO_POSTER_IMAGE_LIMITS.MAX_FILE_SIZE_BYTES + 1
          )
        )
      )

      expect(response.status).toBe(413)
      expect((await response.json()).code).toBe("video.poster.image_too_large")
    })

    it("removes the uploaded image when the poster goes back to automatic", async () => {
      const videoId = await uploadProcessedVideo()

      await putPosterImage(videoId, imageForm(PNG_BYTES))
      const response = await putPoster(videoId, { source: "automatic" })

      expect(response.status).toBe(200)
      expect((await response.json()).data.video.poster.source).toBe("automatic")
      expect(await readPoster(videoId)).toBe("frame@0.30000000000000004")
      expect(
        storedKeys().some((key) => key.endsWith("/poster-image.jpg"))
      ).toBe(false)
    })

    it("deletes the uploaded image with the video", async () => {
      const videoId = await uploadProcessedVideo()

      await putPosterImage(videoId, imageForm(PNG_BYTES))
      await memberClient.delete(`${libraryPath}/videos/${videoId}`)
      await runStorageCleanups(testApp)

      expect(storedKeys()).toEqual([])
    })

    it("records the change in the activity log and tells webhooks", async () => {
      const videoId = await uploadProcessedVideo()

      const saved = await ownerClient.put(`${libraryPath}/webhook`, {
        url: "https://hooks.example.com/openstream",
      })

      expect(saved.status).toBe(200)
      await putPoster(videoId, { source: "frame", atSeconds: 2 })

      const [activity] = (
        await (
          await ownerClient.get(
            `/organizations/acme/activity?resourceType=video&resourceId=${videoId}`
          )
        ).json()
      ).data.activities as ActivityLogDto[]

      expect(activity).toEqual(
        expect.objectContaining({
          action: "video.poster_updated",
          before: { posterSource: "automatic", posterFrameSeconds: null },
          after: { posterSource: "frame", posterFrameSeconds: 2 },
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

    it("keeps other organizations' members away from the poster", async () => {
      const videoId = await uploadProcessedVideo()
      const outsider = await createUserFactory(testApp).create()

      await createOrganizationFactory(testApp)
        .ownedBy(outsider)
        .create({ name: "Other", slug: "other" })
      const outsiderClient = await signInAsUser(testApp, outsider)

      const response = await outsiderClient.put(
        `${libraryPath}/videos/${videoId}/poster`,
        { source: "frame", atSeconds: 1 }
      )

      expect(response.status).toBe(404)
      expect(await readPoster(videoId)).toBe("frame@0.30000000000000004")
    })

    it("lets the library API change the poster with videos:manage", async () => {
      const videoId = await uploadProcessedVideo()
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
      const apiPath = `/libraries/${libraryId}/videos/${videoId}`

      const refused = await reading.put(`${apiPath}/poster`, {
        source: "frame",
        atSeconds: 1,
      })
      const framed = await managing.put(`${apiPath}/poster`, {
        source: "frame",
        atSeconds: 1,
      })
      const uploaded = await managing.request(`${apiPath}/poster/image`, {
        method: "PUT",
        formData: imageForm(PNG_BYTES),
      })

      expect(refused.status).toBe(403)
      expect(framed.status).toBe(200)
      expect(uploaded.status).toBe(200)
      expect(await readPoster(videoId)).toBe("image of 2048 bytes")
    })
  })

  describe.skipIf(!HAS_FFMPEG)("with ffmpeg", () => {
    let workDir: string

    beforeEach(async () => {
      await setUp(await createTestApp())
      workDir = await mkdtemp(join(tmpdir(), "openstream-poster-test-"))
    })

    afterEach(() => rm(workDir, { recursive: true, force: true }))

    /** Width and height of a JPEG, as ffprobe reads them. */
    const readImageSize = async (bytes: ArrayBuffer) => {
      const path = join(workDir, "poster.jpg")

      await Bun.write(path, bytes)

      return Bun.spawnSync([
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "stream=codec_name,width,height",
        "-of",
        "csv=p=0",
        path,
      ])
        .stdout.toString()
        .trim()
    }

    const createPng = async (width: number, height: number) => {
      const path = join(workDir, "upload.png")

      Bun.spawnSync([
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        `testsrc2=size=${width}x${height}`,
        "-frames:v",
        "1",
        path,
      ])

      return new Uint8Array(await Bun.file(path).arrayBuffer())
    }

    it("captures a chosen frame as a JPEG", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ width: 640, height: 360, seconds: 2 })
      )

      await processVideo(videoId)
      const response = await putPoster(videoId, {
        source: "frame",
        atSeconds: 1.5,
      })
      const poster = await memberClient.get(
        `${libraryPath}/videos/${videoId}/poster.jpg`
      )

      expect(response.status).toBe(200)
      expect(await readImageSize(await poster.arrayBuffer())).toBe(
        "mjpeg,640,360"
      )
    })

    it("scales an uploaded image down to the poster's size, keeping its shape", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ seconds: 2 })
      )

      await processVideo(videoId)
      const response = await putPosterImage(
        videoId,
        imageForm(await createPng(2000, 1000))
      )
      const poster = await memberClient.get(
        `${libraryPath}/videos/${videoId}/poster.jpg`
      )

      expect(response.status).toBe(200)
      expect(await readImageSize(await poster.arrayBuffer())).toBe(
        "mjpeg,1280,640"
      )
    })

    it("refuses a file that only starts like an image", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ seconds: 2 })
      )

      await processVideo(videoId)
      const response = await putPosterImage(videoId, imageForm(PNG_BYTES))

      expect(response.status).toBe(415)
      expect((await readVideo(videoId)).poster.source).toBe("automatic")
    })
  })
})
