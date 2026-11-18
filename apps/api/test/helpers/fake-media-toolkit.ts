import { mkdir } from "node:fs/promises"
import { join } from "node:path"

import type { MediaToolkit } from "../../src/media/types/media.types"

/**
 * Stands in for ffmpeg: probes every file as a 3-second 640×360 video and
 * writes a small but complete set of HLS files, a poster and a storyboard;
 * images it converts all become the same tiny JPEG.
 */
export const fakeMediaToolkit: MediaToolkit = {
  probe: async () => ({
    durationSeconds: 3,
    width: 640,
    height: 360,
    videoCodec: "h264",
    audioCodec: "aac",
    frameRate: 24,
  }),
  transcodeToHls: async ({ outputDir, renditions, storyboard }) => {
    for (const { name } of renditions) {
      await mkdir(join(outputDir, name), { recursive: true })
      await Bun.write(
        join(outputDir, name, "playlist.m3u8"),
        "#EXTM3U\n#EXTINF:3.0,\nsegment_00000.ts\n#EXT-X-ENDLIST\n"
      )
      await Bun.write(
        join(outputDir, name, "segment_00000.ts"),
        new Uint8Array([0x47])
      )
    }

    await Bun.write(
      join(outputDir, "master.m3u8"),
      [
        "#EXTM3U",
        ...renditions.flatMap(({ name, width, height }) => [
          `#EXT-X-STREAM-INF:BANDWIDTH=1000,RESOLUTION=${width}x${height}`,
          `${name}/playlist.m3u8`,
        ]),
        "",
      ].join("\n")
    )
    await Bun.write(storyboard.outputPath, new Uint8Array([0xff, 0xd8]))
  },
  captureImage: async ({ outputPath }) => {
    await Bun.write(outputPath, new Uint8Array([0xff, 0xd8]))
  },
  convertImage: async ({ outputPath }) => {
    await Bun.write(outputPath, new Uint8Array([0xff, 0xd8]))
  },
}
