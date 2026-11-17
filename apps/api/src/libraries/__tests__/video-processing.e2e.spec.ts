import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { eq } from "drizzle-orm"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import {
  AVAILABLE_VIDEO_ENCODERS,
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

import { videos } from "../../db/schema"
import { LibrariesRepository } from "../repository/libraries.repository"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { MediaToolkit } from "../../media/types/media.types"
import type { LibraryDto, VideoDto } from "../dto/libraries.schemas"

/** An MP4 that passes the upload checks without being playable, for tests that never run ffmpeg on it. */
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

/**
 * Writes playable-looking output without ffmpeg. The first transcode waits
 * until `releaseFirstTranscode` is called, so a test can act while a run is
 * in the middle of processing.
 */
const createGatedMediaToolkit = () => {
  let releaseFirstTranscode = () => {}
  let markFirstTranscodeStarted = () => {}
  const firstTranscodeGate = new Promise<void>((resolve) => {
    releaseFirstTranscode = resolve
  })
  const firstTranscodeStarted = new Promise<void>((resolve) => {
    markFirstTranscodeStarted = resolve
  })
  let transcodeCount = 0

  const mediaToolkit: MediaToolkit = {
    probe: failingMediaToolkit.probe,
    transcodeToHls: async ({ outputDir, renditions }) => {
      transcodeCount += 1

      if (transcodeCount === 1) {
        markFirstTranscodeStarted()
        await firstTranscodeGate
      }

      await mkdir(join(outputDir, renditions[0]!.name), { recursive: true })
      await Bun.write(
        join(outputDir, "master.m3u8"),
        `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\n${renditions[0]!.name}/playlist.m3u8\n`
      )
      await Bun.write(
        join(outputDir, renditions[0]!.name, "playlist.m3u8"),
        `#EXTM3U\nrun-${transcodeCount}\n`
      )
    },
    captureImage: async ({ outputPath }) => {
      await Bun.write(outputPath, new Uint8Array([0xff, 0xd8]))
    },
  }

  return {
    mediaToolkit,
    firstTranscodeStarted,
    releaseFirstTranscode: () => releaseFirstTranscode(),
    transcodeCount: () => transcodeCount,
  }
}

describe("Video processing (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let library: LibraryDto
  let libraryPath: string

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
    const response = await createTusClient(
      memberClient,
      `${libraryPath}/videos/${video.id}`
    ).upload(bytes, "clip.mp4", bytes.byteLength)

    expect(response.status).toBe(204)

    return video.id as string
  }

  const readVideo = async (videoId: string): Promise<VideoDto> =>
    (await (await memberClient.get(`${libraryPath}/videos/${videoId}`)).json())
      .data.video

  /** Runs what the worker runs for the video's latest processing request. */
  const processVideo = async (videoId: string, isFinalAttempt = true) => {
    const request = (await findVideoProcessingRequests(testApp))
      .filter((each) => each.videoId === videoId)
      .at(-1)

    if (!request) throw new Error(`No processing request for ${videoId}`)

    await testApp.appModule.videoProcessingService.processVideo(request, {
      isFinalAttempt,
    })
  }

  const storedKeys = () =>
    testApp.objectStorage.listObjectKeys(
      testApp.appModule.defaultStorageLocation
    )

  describe("queueing", () => {
    beforeEach(async () => setUp(await createTestApp()))

    it("queues a video for processing once its file is uploaded", async () => {
      const videoId = await uploadVideo(mp4Placeholder())

      expect(await readVideo(videoId)).toEqual(
        expect.objectContaining({
          status: "uploaded",
          processingStatus: "pending",
          renditions: [],
        })
      )
      expect(await findVideoProcessingRequests(testApp)).toEqual([
        { videoId, requestId: expect.any(String) },
      ])
    })

    it("lets the owner choose the qualities to transcode", async () => {
      const defaults = await ownerClient.get(`${libraryPath}/encoding`)
      const updated = await ownerClient.put(`${libraryPath}/encoding`, {
        transcodeQualities: ["1080p", "360p", "360p"],
      })
      const forbidden = await memberClient.put(`${libraryPath}/encoding`, {
        transcodeQualities: ["360p"],
      })
      const empty = await ownerClient.put(`${libraryPath}/encoding`, {
        transcodeQualities: [],
      })

      expect((await defaults.json()).data.encoding).toEqual({
        transcodeQualities: ["360p", "480p", "720p", "1080p"],
      })
      expect((await updated.json()).data.encoding).toEqual({
        transcodeQualities: ["360p", "1080p"],
      })
      expect([forbidden.status, empty.status]).toEqual([403, 422])
    })

    it("keeps a video processing on a failed attempt and fails it on the last one", async () => {
      await testApp.close()
      await setUp(
        await createTestApp({}, { mediaToolkit: failingMediaToolkit })
      )
      const videoId = await uploadVideo(mp4Placeholder())

      await expect(processVideo(videoId, false)).rejects.toThrow(
        "ffmpeg crashed"
      )
      const afterRetryableFailure = await readVideo(videoId)
      await expect(processVideo(videoId, true)).rejects.toThrow(
        "ffmpeg crashed"
      )

      expect(afterRetryableFailure.processingStatus).toBe("processing")
      expect(await readVideo(videoId)).toEqual(
        expect.objectContaining({
          processingStatus: "failed",
          processingFailureReason: "transcoding_failed",
        })
      )
    })

    it("answers members asking to play an unprocessed video with a conflict", async () => {
      const videoId = await uploadVideo(mp4Placeholder())

      const response = await memberClient.get(
        `${libraryPath}/videos/${videoId}/hls/master.m3u8`
      )

      expect(response.status).toBe(409)
    })

    it("does not reprocess a video still waiting to be processed", async () => {
      const videoId = await uploadVideo(mp4Placeholder())

      const response = await memberClient.post(
        `${libraryPath}/videos/${videoId}/reprocess`
      )

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe(
        "video.processing.not_reprocessable"
      )
    })
  })

  describe("runs", () => {
    let gatedToolkit: ReturnType<typeof createGatedMediaToolkit>

    beforeEach(async () => {
      gatedToolkit = createGatedMediaToolkit()
      await setUp(
        await createTestApp({}, { mediaToolkit: gatedToolkit.mediaToolkit })
      )
    })

    /** Makes the video's run look dead: it last renewed its claim at `renewedAt`, long ago by default. */
    const stallRun = (videoId: string, renewedAt = new Date(0)) =>
      testApp.appModule.db
        .update(videos)
        .set({ processingHeartbeatAt: renewedAt })
        .where(eq(videos.id, videoId))

    const variantPlaylist = () => {
      const key = storedKeys().find((each) =>
        each.endsWith("/hls/360p/playlist.m3u8")
      )

      return key
        ? new TextDecoder().decode(
            testApp.objectStorage.readObject(
              testApp.appModule.defaultStorageLocation,
              key
            )!
          )
        : null
    }

    it("leaves a video to the run that holds it", async () => {
      const videoId = await uploadVideo(mp4Placeholder())
      const firstRun = processVideo(videoId)
      await gatedToolkit.firstTranscodeStarted

      await processVideo(videoId)
      const whileFirstRuns = await readVideo(videoId)
      gatedToolkit.releaseFirstTranscode()
      await firstRun

      expect(gatedToolkit.transcodeCount()).toBe(1)
      expect(whileFirstRuns.processingStatus).toBe("processing")
      expect((await readVideo(videoId)).processingStatus).toBe("ready")
    })

    it("lets a new run take over a stalled one, whose late files never replace the new run's", async () => {
      const videoId = await uploadVideo(mp4Placeholder())
      const stalledRun = processVideo(videoId, false)
      await gatedToolkit.firstTranscodeStarted

      await stallRun(videoId)
      await processVideo(videoId)
      const afterTakeOver = variantPlaylist()
      gatedToolkit.releaseFirstTranscode()

      await expect(stalledRun).rejects.toThrow("no longer held by this run")
      expect(afterTakeOver).toContain("run-2")
      expect(variantPlaylist()).toContain("run-2")
      expect((await readVideo(videoId)).processingStatus).toBe("ready")
    })

    it("fails a video whose run died, so it can be reprocessed", async () => {
      const videoId = await uploadVideo(mp4Placeholder())
      const deadRun = processVideo(videoId)
      await gatedToolkit.firstTranscodeStarted

      await stallRun(videoId)
      const failedCount =
        await testApp.appModule.videoProcessingService.failStalledVideos()
      const failed = await readVideo(videoId)
      const reprocess = await memberClient.post(
        `${libraryPath}/videos/${videoId}/reprocess`
      )
      gatedToolkit.releaseFirstTranscode()
      await deadRun.catch(() => {})

      expect(failedCount).toBe(1)
      expect(failed).toEqual(
        expect.objectContaining({
          processingStatus: "failed",
          processingFailureReason: "transcoding_failed",
        })
      )
      expect(reprocess.status).toBe(202)
    })

    it("leaves a video waiting for its next attempt to the queue", async () => {
      await testApp.close()
      await setUp(
        await createTestApp({}, { mediaToolkit: failingMediaToolkit })
      )
      const videoId = await uploadVideo(mp4Placeholder())
      await processVideo(videoId, false).catch(() => {})

      // Past the stall timeout, but within the retry delay that follows it.
      await stallRun(
        videoId,
        new Date(
          Date.now() -
            testApp.appModule.config.VIDEO_PROCESSING_STALL_TIMEOUT_MS -
            1000
        )
      )
      const failedCount =
        await testApp.appModule.videoProcessingService.failStalledVideos()

      expect(failedCount).toBe(0)
      expect((await readVideo(videoId)).processingStatus).toBe("processing")
    })

    it("fails a video whose next attempt never came, so it can be reprocessed", async () => {
      await testApp.close()
      await setUp(
        await createTestApp({}, { mediaToolkit: failingMediaToolkit })
      )
      const videoId = await uploadVideo(mp4Placeholder())
      await processVideo(videoId, false).catch(() => {})

      await stallRun(videoId)
      const failedCount =
        await testApp.appModule.videoProcessingService.failStalledVideos()
      const reprocess = await memberClient.post(
        `${libraryPath}/videos/${videoId}/reprocess`
      )

      expect(failedCount).toBe(1)
      expect(reprocess.status).toBe(202)
    })

    it("ends the run of a video whose library was deleted after it was claimed", async () => {
      const videoId = await uploadVideo(mp4Placeholder())
      const findLibrary = spyOn(
        LibrariesRepository.prototype,
        "findPublicLibrary"
      ).mockResolvedValueOnce(null)

      try {
        await processVideo(videoId)
      } finally {
        findLibrary.mockRestore()
      }

      expect(gatedToolkit.transcodeCount()).toBe(0)
      expect((await readVideo(videoId)).processingStatus).toBe("failed")
    })

    it("removes the files of a video deleted while it was processed", async () => {
      const videoId = await uploadVideo(mp4Placeholder())
      const run = processVideo(videoId)
      await gatedToolkit.firstTranscodeStarted

      await memberClient.delete(`${libraryPath}/videos/${videoId}`)
      await runStorageCleanups(testApp)
      gatedToolkit.releaseFirstTranscode()
      await run.catch(() => {})

      expect(storedKeys()).toEqual([])
    })
  })

  describe.each(AVAILABLE_VIDEO_ENCODERS)("with the %s encoder", (encoder) => {
    beforeEach(async () =>
      setUp(await createTestApp({ VIDEO_ENCODER: encoder }))
    )

    it("cuts every quality into the same 6-second segments", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ width: 854, height: 480, seconds: 13 })
      )

      await processVideo(videoId)
      const keys = storedKeys()
      const readText = (suffix: string) => {
        const key = keys.find((each) => each.endsWith(suffix))

        return new TextDecoder().decode(
          testApp.objectStorage.readObject(
            testApp.appModule.defaultStorageLocation,
            key!
          )!
        )
      }
      const segmentDurations = (quality: string) =>
        [
          ...readText(`/hls/${quality}/playlist.m3u8`).matchAll(
            /#EXTINF:([\d.]+)/g
          ),
        ].map(([, seconds]) => Math.round(Number(seconds)))
      const storyboard = testApp.objectStorage.readObject(
        testApp.appModule.defaultStorageLocation,
        keys.find((key) => key.endsWith("/thumbnails/storyboard.jpg"))!
      )!

      expect((await readVideo(videoId)).processingStatus).toBe("ready")
      expect(segmentDurations("360p")).toEqual([6, 6, 1])
      expect(segmentDurations("480p")).toEqual([6, 6, 1])
      expect([...storyboard.subarray(0, 2)]).toEqual([0xff, 0xd8])
    })
  })

  describe.skipIf(!HAS_FFMPEG)("with ffmpeg", () => {
    beforeEach(async () => setUp(await createTestApp()))

    it("transcodes to HLS without upscaling and records what the file holds", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ width: 854, height: 480, seconds: 3 })
      )

      await processVideo(videoId)
      const video = await readVideo(videoId)
      const keys = storedKeys()

      expect(video).toEqual(
        expect.objectContaining({
          processingStatus: "ready",
          processingFailureReason: null,
          width: 854,
          height: 480,
          renditions: [
            {
              quality: "360p",
              width: 640,
              height: 360,
              bandwidth: expect.any(Number),
            },
            {
              quality: "480p",
              width: 854,
              height: 480,
              bandwidth: expect.any(Number),
            },
          ],
          processedAt: expect.any(String),
        })
      )
      expect(video.durationSeconds).toBeCloseTo(3, 0)
      expect(keys.filter((key) => key.includes("/hls/"))).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\/hls\/master\.m3u8$/),
          expect.stringMatching(/\/hls\/360p\/playlist\.m3u8$/),
          expect.stringMatching(/\/hls\/480p\/segment_00000\.ts$/),
        ])
      )
      expect(keys).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\/thumbnails\/poster\.jpg$/),
          expect.stringMatching(/\/thumbnails\/storyboard\.jpg$/),
          expect.stringMatching(/\/thumbnails\/storyboard\.vtt$/),
        ])
      )
    })

    it("reads the source straight from storage, keeping its signed URL out of errors", async () => {
      const videoId = await uploadVideo(mp4Placeholder())

      const error = await processVideo(videoId).catch((thrown: Error) => thrown)

      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain("/objects/")
      expect((error as Error).message).not.toContain("test-signature")
      expect(testApp.objectStorage.readUrlRequestCount).toBeGreaterThan(0)
    })

    it("transcodes only the qualities the library chose", async () => {
      await ownerClient.put(`${libraryPath}/encoding`, {
        transcodeQualities: ["480p"],
      })
      const videoId = await uploadVideo(
        await createTestMediaFile({ width: 1280, height: 720, seconds: 2 })
      )

      await processVideo(videoId)

      expect(
        (await readVideo(videoId)).renditions.map(({ quality }) => quality)
      ).toEqual(["480p"])
    })

    it("fails a file without a picture right away", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ hasVideo: false, seconds: 2 })
      )

      await expect(processVideo(videoId, false)).rejects.toThrow()

      expect(await readVideo(videoId)).toEqual(
        expect.objectContaining({
          processingStatus: "failed",
          processingFailureReason: "no_video_stream",
        })
      )
    })

    it("reprocesses a ready video with the library's current qualities", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ width: 854, height: 480, seconds: 2 })
      )

      await processVideo(videoId)
      await ownerClient.put(`${libraryPath}/encoding`, {
        transcodeQualities: ["480p"],
      })
      const response = await memberClient.post(
        `${libraryPath}/videos/${videoId}/reprocess`
      )
      await processVideo(videoId)

      expect(response.status).toBe(202)
      expect((await response.json()).data.video.processingStatus).toBe(
        "pending"
      )
      expect(
        (await readVideo(videoId)).renditions.map(({ quality }) => quality)
      ).toEqual(["480p"])
      expect(storedKeys().some((key) => key.includes("/hls/360p/"))).toBe(false)
    })

    it("deletes the processed files with the video", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ seconds: 2 })
      )

      await processVideo(videoId)
      await memberClient.delete(`${libraryPath}/videos/${videoId}`)
      await runStorageCleanups(testApp)

      expect(storedKeys()).toEqual([])
    })

    it("shows members the poster in the web app", async () => {
      const videoId = await uploadVideo(
        await createTestMediaFile({ seconds: 2 })
      )
      const posterPath = `${libraryPath}/videos/${videoId}/poster.jpg`
      const beforeProcessing = await memberClient.get(posterPath)

      await processVideo(videoId)
      const response = await memberClient.get(posterPath)
      const bytes = new Uint8Array(await response.arrayBuffer())

      expect(beforeProcessing.status).toBe(409)
      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toBe("image/jpeg")
      expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xd8])
    })

    describe("playback", () => {
      let videoId: string
      let apiPath: string
      let apiClient: ApiClient
      let viewer: ApiClient

      beforeEach(async () => {
        videoId = await uploadVideo(await createTestMediaFile({ seconds: 3 }))
        await processVideo(videoId)
        apiPath = `/libraries/${library.id}/videos/${videoId}`
        apiClient = createLibraryApiClient(
          testApp,
          (
            await (
              await ownerClient.post(`${libraryPath}/api-keys`, {
                name: "Player",
                scopes: ["playback:sign", "videos:manage"],
              })
            ).json()
          ).data.secret
        )
        viewer = createLibraryApiClient(testApp)
      })

      const toApiPath = (url: string) => {
        const parsed = new URL(url)

        return `${parsed.pathname.slice("/api/v1".length)}${parsed.search}`
      }

      it("plays HLS from the master playlist down to a segment", async () => {
        const master = await viewer.get(`${apiPath}/hls/master.m3u8`)
        const variant = await viewer.get(`${apiPath}/hls/360p/playlist.m3u8`)
        const variantText = await variant.text()
        const segmentName = variantText
          .split("\n")
          .find((line) => line.endsWith(".ts"))
        const segment = await viewer.get(`${apiPath}/hls/360p/${segmentName}`)

        expect(master.status).toBe(200)
        expect(master.headers.get("content-type")).toBe(
          "application/vnd.apple.mpegurl"
        )
        expect(await master.text()).toContain("360p/playlist.m3u8")
        expect(segment.status).toBe(200)
        expect(segment.headers.get("content-type")).toBe("video/mp2t")
        expect((await segment.arrayBuffer()).byteLength).toBeGreaterThan(0)
      })

      it.each([
        "720p/playlist.m3u8",
        "../source",
        "360p/../../source",
        "360p/other.ts",
      ])("does not serve %s", async (path) => {
        const response = await viewer.get(`${apiPath}/hls/${path}`)

        expect(response.status).toBe(404)
      })

      it("serves the poster and storyboard", async () => {
        const [poster, storyboard] = await Promise.all([
          viewer.get(`${apiPath}/thumbnails/poster.jpg`),
          viewer.get(`${apiPath}/thumbnails/storyboard.vtt`),
        ])

        expect(poster.headers.get("content-type")).toBe("image/jpeg")
        expect(await storyboard.text()).toStartWith(
          "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nstoryboard.jpg#xywh=0,0,160,90"
        )
      })

      it("plays for members in the web app whatever the library's playback rules", async () => {
        await ownerClient.put(`${libraryPath}/security`, {
          allowedPlaybackHosts: ["videos.example.com"],
          requireSignedPlayback: true,
        })
        const memberPath = `${libraryPath}/videos/${videoId}`

        const master = await memberClient.get(`${memberPath}/hls/master.m3u8`)
        const variant = await memberClient.get(
          `${memberPath}/hls/360p/playlist.m3u8`
        )
        const segmentName = (await variant.text())
          .split("\n")
          .find((line) => line.endsWith(".ts"))
        const segment = await memberClient.get(
          `${memberPath}/hls/360p/${segmentName}`
        )
        const storyboard = await memberClient.get(
          `${memberPath}/thumbnails/storyboard.vtt`
        )
        const publicMaster = await viewer.get(`${apiPath}/hls/master.m3u8`)

        expect(await master.text()).toContain("360p/playlist.m3u8")
        expect(segment.status).toBe(200)
        expect(segment.headers.get("content-type")).toBe("video/mp2t")
        expect(await storyboard.text()).toContain("storyboard.jpg#xywh=")
        expect(publicMaster.status).toBe(403)
      })

      it("keeps the member routes from other users and from files outside the video", async () => {
        const outsider = await signInAsUser(
          testApp,
          await createUserFactory(testApp).create()
        )
        const memberPath = `${libraryPath}/videos/${videoId}`

        const responses = await Promise.all([
          outsider.get(`${memberPath}/hls/master.m3u8`),
          memberClient.get(`${memberPath}/hls/../source`),
          memberClient.get(`${memberPath}/hls/720p/playlist.m3u8`),
          memberClient.get(`${memberPath}/thumbnails/source`),
        ])

        expect(responses.map(({ status }) => status)).toEqual([
          404, 404, 404, 404,
        ])
      })

      it("passes the signature on to every file when signed playback is required", async () => {
        await ownerClient.put(`${libraryPath}/security`, {
          allowedPlaybackHosts: [],
          requireSignedPlayback: true,
        })
        const { playback } = (
          await (await apiClient.post(`${apiPath}/playback-urls`, {})).json()
        ).data
        const signature = new URL(playback.hlsUrl).search.slice(1)

        const unsigned = await viewer.get(`${apiPath}/hls/master.m3u8`)
        const master = await (
          await viewer.get(toApiPath(playback.hlsUrl))
        ).text()
        const variantUri = master
          .split("\n")
          .find((line) => line.startsWith("360p/"))!
        const variant = await (
          await viewer.get(`${apiPath}/hls/${variantUri}`)
        ).text()
        const segmentUri = variant
          .split("\n")
          .find((line) => line.includes(".ts"))!
        const segment = await viewer.get(`${apiPath}/hls/360p/${segmentUri}`)
        const storyboard = await (
          await viewer.get(toApiPath(playback.storyboardUrl))
        ).text()

        expect(unsigned.status).toBe(403)
        expect(variantUri).toEndWith(`?${signature}`)
        expect(segmentUri).toEndWith(`?${signature}`)
        expect(segment.status).toBe(200)
        expect(storyboard).toContain(`storyboard.jpg?${signature}#xywh=`)
        expect((await viewer.get(toApiPath(playback.posterUrl))).status).toBe(
          200
        )
      })

      it("reprocesses through the library API with videos:manage", async () => {
        const response = await apiClient.post(`${apiPath}/reprocess`)

        expect(response.status).toBe(202)
        expect((await viewer.get(`${apiPath}/hls/master.m3u8`)).status).toBe(
          409
        )
      })
    })
  })
})
