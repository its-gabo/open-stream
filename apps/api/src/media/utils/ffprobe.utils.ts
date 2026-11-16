import { z } from "zod"
import type { MediaProbe } from "../types/media.types"

const ffprobeOutputSchema = z.object({
  streams: z
    .array(
      z.object({
        codec_type: z.string().optional(),
        codec_name: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        tags: z.object({ rotate: z.string().optional() }).optional(),
        side_data_list: z
          .array(z.object({ rotation: z.number().optional() }))
          .optional(),
      })
    )
    .default([]),
  format: z.object({ duration: z.string().optional() }).optional(),
})

/** Rotation in degrees, from the display matrix or the older `rotate` tag. */
const readRotation = (
  stream: z.infer<typeof ffprobeOutputSchema>["streams"][number]
) =>
  stream.side_data_list?.find((data) => data.rotation !== undefined)
    ?.rotation ?? Number(stream.tags?.rotate ?? 0)

/** The probe of `ffprobe -print_format json -show_streams -show_format`; null without a video stream. */
export function parseFfprobeOutput(output: string): MediaProbe | null {
  const parsed = ffprobeOutputSchema.parse(JSON.parse(output))
  const video = parsed.streams.find(
    (stream) => stream.codec_type === "video" && stream.width && stream.height
  )
  const audio = parsed.streams.find((stream) => stream.codec_type === "audio")
  const durationSeconds = Number(parsed.format?.duration ?? 0)

  if (!video?.width || !video.height || !(durationSeconds > 0)) return null

  const isQuarterTurn = Math.abs(readRotation(video)) % 180 === 90

  return {
    durationSeconds,
    width: isQuarterTurn ? video.height : video.width,
    height: isQuarterTurn ? video.width : video.height,
    videoCodec: video.codec_name ?? "unknown",
    audioCodec: audio?.codec_name ?? null,
  }
}
