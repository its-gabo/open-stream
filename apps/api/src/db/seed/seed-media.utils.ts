import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { SeedVideoFile } from "./seed.constants"

/** An MP4 of an ffmpeg test pattern and a tone, small enough to make in a second or two. */
export async function createSeedVideoFile(
  ffmpegPath: string,
  { pattern, width, height, seconds, toneHz }: SeedVideoFile
) {
  const dir = await mkdtemp(join(tmpdir(), "openstream-seed-"))
  const outputPath = join(dir, "seed.mp4")
  const videoArgs = pattern
    ? [
        "-f",
        "lavfi",
        "-i",
        `${pattern}=size=${width}x${height}:rate=24:duration=${seconds}`,
      ]
    : []
  const child = Bun.spawn(
    [
      ffmpegPath,
      "-hide_banner",
      "-loglevel",
      "error",
      ...videoArgs,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${toneHz}:duration=${seconds}`,
      ...(pattern
        ? ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p"]
        : []),
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-shortest",
      outputPath,
    ],
    { stderr: "pipe" }
  )

  try {
    if ((await child.exited) !== 0) {
      throw new Error(
        `ffmpeg could not make a seed video: ${await new Response(child.stderr).text()}`
      )
    }

    return await Bun.file(outputPath).bytes()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
