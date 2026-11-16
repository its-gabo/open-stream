import { z } from "zod"
import {
  VIDEO_ENCODERS,
  X264_PRESETS,
} from "../../media/constants/media.constants"

export const videoProcessingConfigSchema = z.object({
  FFMPEG_PATH: z.string().min(1).default("ffmpeg"),
  FFPROBE_PATH: z.string().min(1).default("ffprobe"),
  /** ffmpeg or ffprobe is stopped after this long without progress; a transcode makes progress as it gets through the source. */
  FFMPEG_STALL_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
  /** `x264` on the CPU by default; `videotoolbox` (Mac) or `nvenc` (NVIDIA) encode on the GPU. */
  VIDEO_ENCODER: z.enum(VIDEO_ENCODERS).default(VIDEO_ENCODERS.X264),
  /** Speed against quality for `x264`; faster presets give a slightly lower quality at the same bitrate. */
  VIDEO_X264_PRESET: z.enum(X264_PRESETS).default(X264_PRESETS.VERYFAST),
  /** Videos one worker transcodes at a time; each one keeps several CPU cores busy. */
  VIDEO_PROCESSING_CONCURRENCY: z.coerce.number().int().positive().default(1),
  VIDEO_PROCESSING_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  VIDEO_PROCESSING_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),
  /** How often a processing run renews its claim on the video, and how often stalled runs are looked for. */
  VIDEO_PROCESSING_HEARTBEAT_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  /** A run that has not renewed its claim for this long is taken for dead: its video can be claimed again or is failed. */
  VIDEO_PROCESSING_STALL_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(300_000),
  /** Where renditions are kept while a video is processed, before they are uploaded; the system temp directory by default. */
  VIDEO_PROCESSING_TEMP_DIR: z.string().min(1).optional(),
})
