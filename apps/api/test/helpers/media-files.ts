import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { VIDEO_ENCODERS } from "../../src/media/constants/media.constants"

import type { VideoEncoder } from "../../src/media/types/media.types"

/** True where ffmpeg is installed; tests that transcode real files are skipped elsewhere. */
export const HAS_FFMPEG =
  Bun.which("ffmpeg") !== null && Bun.which("ffprobe") !== null

const ENCODER_CODECS = {
  [VIDEO_ENCODERS.X264]: "libx264",
  [VIDEO_ENCODERS.VIDEOTOOLBOX]: "h264_videotoolbox",
  [VIDEO_ENCODERS.NVENC]: "h264_nvenc",
} as const satisfies Record<VideoEncoder, string>

/** Whether a tiny encode works: an encoder can be built into ffmpeg without the hardware it needs. */
const canEncodeWith = (codec: string) =>
  HAS_FFMPEG &&
  Bun.spawnSync([
    "ffmpeg",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=320x240:rate=24:duration=0.2",
    "-c:v",
    codec,
    "-f",
    "null",
    "-",
  ]).exitCode === 0

/** Encoders this machine can transcode with; hardware ones are tested only where they work. */
export const AVAILABLE_VIDEO_ENCODERS = Object.values(VIDEO_ENCODERS).filter(
  (encoder) => canEncodeWith(ENCODER_CODECS[encoder])
)

type TestMediaOptions = {
  width?: number
  height?: number
  seconds?: number
  hasVideo?: boolean
  hasAudio?: boolean
}

/** A small, real MP4 made by ffmpeg from a test pattern and a tone. */
export async function createTestMediaFile({
  width = 640,
  height = 360,
  seconds = 3,
  hasVideo = true,
  hasAudio = true,
}: TestMediaOptions = {}) {
  const dir = await mkdtemp(join(tmpdir(), "openstream-test-media-"))
  const outputPath = join(dir, "test.mp4")
  const inputs = [
    ...(hasVideo
      ? [
          "-f",
          "lavfi",
          "-i",
          `testsrc2=size=${width}x${height}:rate=24:duration=${seconds}`,
        ]
      : []),
    ...(hasAudio
      ? ["-f", "lavfi", "-i", `sine=frequency=440:duration=${seconds}`]
      : []),
  ]
  const child = Bun.spawn(
    [
      "ffmpeg",
      "-hide_banner",
      "-loglevel",
      "error",
      ...inputs,
      ...(hasVideo
        ? ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p"]
        : []),
      ...(hasAudio ? ["-c:a", "aac"] : []),
      "-shortest",
      outputPath,
    ],
    { stderr: "pipe" }
  )

  try {
    if ((await child.exited) !== 0) {
      throw new Error(await new Response(child.stderr).text())
    }

    return new Uint8Array(await Bun.file(outputPath).arrayBuffer())
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
