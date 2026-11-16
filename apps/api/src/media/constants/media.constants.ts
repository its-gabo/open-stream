/**
 * How H.264 is encoded: `x264` on the CPU works everywhere; the others use
 * the GPU, which must exist on the worker host: VideoToolbox on Macs, NVENC
 * on NVIDIA cards. GPUs spare the CPU but are not always faster: on an M1
 * Pro, VideoToolbox encoded at half the speed of x264 on all ten cores.
 */
export const VIDEO_ENCODERS = {
  X264: "x264",
  VIDEOTOOLBOX: "videotoolbox",
  NVENC: "nvenc",
} as const

/**
 * x264 presets from fastest to slowest. At the same bitrate a faster one
 * gives a slightly lower quality: on a 60-second 1080p source, `superfast`
 * took 30% less time than `veryfast`, and `ultrafast` 44% less.
 */
export const X264_PRESETS = {
  ULTRAFAST: "ultrafast",
  SUPERFAST: "superfast",
  VERYFAST: "veryfast",
  FASTER: "faster",
  FAST: "fast",
  MEDIUM: "medium",
} as const

/** How long ffmpeg may keep reading a source URL; a transcode outlasting it fails and is retried. */
export const SOURCE_URL_TTL_SECONDS = 12 * 60 * 60

/** Characters of ffmpeg's error output kept in a failure message. */
export const ERROR_OUTPUT_TAIL_LENGTH = 2000
