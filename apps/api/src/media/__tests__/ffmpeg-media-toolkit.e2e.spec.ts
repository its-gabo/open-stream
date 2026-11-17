import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { chmod, mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  HAS_FFMPEG,
  createTestMediaFile,
} from "../../../test/helpers/media-files"
import { createTestConfig } from "../../../test/helpers/test-app"
import { FfmpegMediaToolkitService } from "../services/ffmpeg-media-toolkit.service"

import type { HlsTranscodeJob } from "../types/media.types"

describe("ffmpeg media toolkit (e2e)", () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "openstream-media-spec-"))
  })

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  const createToolkit = (config: Record<string, string> = {}) =>
    new FfmpegMediaToolkitService(createTestConfig(config))

  /** A shell script standing in for ffmpeg or ffprobe. */
  const createFakeCommand = async (script: string) => {
    const path = join(workDir, `fake-command-${crypto.randomUUID()}`)

    await Bun.write(path, `#!/bin/sh\n${script}\n`)
    await chmod(path, 0o755)

    return path
  }

  /** When each frame of a file or HLS playlist is shown, in seconds. */
  const readFrameTimes = async (path: string) => {
    const child = Bun.spawn(
      [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "frame=pts_time",
        "-of",
        "csv=p=0",
        path,
      ],
      { stdout: "pipe" }
    )
    const output = await new Response(child.stdout).text()

    await child.exited

    // A frame with side data gets a trailing comma.
    return output
      .trim()
      .split("\n")
      .map((line) => Number.parseFloat(line))
  }

  const writeSource = async (
    options?: Parameters<typeof createTestMediaFile>[0]
  ) => {
    const path = join(workDir, "source.mp4")

    await Bun.write(path, await createTestMediaFile(options))

    return path
  }

  const hlsJob = (source: string, onProgress?: (seconds: number) => void) =>
    ({
      source,
      outputDir: join(workDir, "hls"),
      renditions: [
        {
          name: "360p",
          width: 640,
          height: 360,
          videoBitrateKbps: 800,
          audioBitrateKbps: 96,
        },
      ],
      hasAudio: true,
      sourceFrameRate: 24,
      segmentSeconds: 2,
      masterPlaylistName: "master.m3u8",
      variantPlaylistName: "playlist.m3u8",
      segmentFilePattern: "segment_%05d.ts",
      storyboard: {
        outputPath: join(workDir, "thumbnails", "storyboard.jpg"),
        intervalSeconds: 1,
        tileWidth: 160,
        tileHeight: 90,
        columns: 3,
        rows: 1,
      },
      onProgress,
    }) satisfies HlsTranscodeJob

  describe.skipIf(!HAS_FFMPEG)("with ffmpeg", () => {
    it("probes what a file holds", async () => {
      const source = await writeSource({ width: 640, height: 360, seconds: 2 })

      expect(await createToolkit().probe(source)).toEqual({
        durationSeconds: expect.closeTo(2, 0),
        width: 640,
        height: 360,
        videoCodec: "h264",
        audioCodec: "aac",
        frameRate: 24,
      })
    })

    it("finds no picture in a file with sound only", async () => {
      const source = await writeSource({ hasVideo: false })

      expect(await createToolkit().probe(source)).toBeNull()
    })

    it("transcodes to HLS with a storyboard and reports progress", async () => {
      const source = await writeSource({ seconds: 3 })
      const progress: number[] = []

      await createToolkit().transcodeToHls(
        hlsJob(source, (seconds) => progress.push(seconds))
      )

      expect(await readdir(join(workDir, "hls"))).toContain("master.m3u8")
      expect(await readdir(join(workDir, "hls", "360p"))).toContain(
        "playlist.m3u8"
      )
      expect(
        await Bun.file(join(workDir, "thumbnails", "storyboard.jpg")).exists()
      ).toBe(true)
      expect(progress.length).toBeGreaterThan(0)
      expect(progress).toEqual([...progress].sort((a, b) => a - b))
    })

    it("fills the gaps of a variable-rate source, so playback never stalls on one", async () => {
      const source = await writeSource({
        seconds: 3,
        missingFrames: { from: 1, to: 2 },
      })

      await createToolkit().transcodeToHls(hlsJob(source))

      const frameTimes = await readFrameTimes(
        join(workDir, "hls", "360p", "playlist.m3u8")
      )
      const longestGap = Math.max(
        ...frameTimes.slice(1).map((time, index) => time - frameTimes[index]!)
      )

      expect(frameTimes.length).toBeGreaterThan(60)
      expect(longestGap).toBeLessThan(2 / 24)
    })

    it("captures one frame as an image", async () => {
      const source = await writeSource()
      const outputPath = join(workDir, "poster", "poster.jpg")

      await createToolkit().captureImage({
        source,
        outputPath,
        atSeconds: 1,
        width: 320,
        height: 180,
      })

      expect(await Bun.file(outputPath).exists()).toBe(true)
    })

    it("fails a capture that matched no frame", async () => {
      const source = await writeSource({ seconds: 1 })

      await expect(
        createToolkit().captureImage({
          source,
          outputPath: join(workDir, "poster.jpg"),
          atSeconds: 60,
          width: 320,
          height: 180,
        })
      ).rejects.toThrow("ffmpeg wrote no output")
    })
  })

  it("fails with the end of the error output, without signed URL queries", async () => {
    const ffprobe = await createFakeCommand(
      'echo "https://storage.test/source?X-Amz-Signature=secret: 403 Forbidden" >&2\nexit 1'
    )

    const probing = createToolkit({ FFPROBE_PATH: ffprobe }).probe(
      "https://storage.test/source?X-Amz-Signature=secret"
    )

    await expect(probing).rejects.toThrow("exited with 1")
    await expect(probing).rejects.not.toThrow("secret")
  })

  it("stops a command that makes no progress", async () => {
    const ffprobe = await createFakeCommand("sleep 30")

    await expect(
      createToolkit({
        FFPROBE_PATH: ffprobe,
        FFMPEG_STALL_TIMEOUT_MS: "200",
      }).probe(join(workDir, "source.mp4"))
    ).rejects.toThrow("made no progress for 0.2 seconds")
  })

  it("stops a transcode whose reported position stopped moving", async () => {
    const ffmpeg = await createFakeCommand(
      "while true; do echo out_time_us=1000000; sleep 0.05; done"
    )

    await expect(
      createToolkit({
        FFMPEG_PATH: ffmpeg,
        FFMPEG_STALL_TIMEOUT_MS: "300",
      }).transcodeToHls(hlsJob(join(workDir, "source.mp4")))
    ).rejects.toThrow("made no progress")
  })

  it("lets a transcode run past the stall timeout while it moves forward", async () => {
    const ffmpeg = await createFakeCommand(
      "for us in 1 2 3 4 5 6 7 8; do echo out_time_us=${us}000000; sleep 0.2; done"
    )
    const progress: number[] = []

    // The fake writes no storyboard, so the run fails after ffmpeg exits,
    // not because it was stopped.
    await expect(
      createToolkit({
        FFMPEG_PATH: ffmpeg,
        FFMPEG_STALL_TIMEOUT_MS: "1000",
      }).transcodeToHls(
        hlsJob(join(workDir, "source.mp4"), (seconds) => progress.push(seconds))
      )
    ).rejects.toThrow("ffmpeg wrote no output")
    expect(progress).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})
