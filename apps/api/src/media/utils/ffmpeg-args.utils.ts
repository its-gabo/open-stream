import { match } from "ts-pattern"
import { VIDEO_ENCODERS } from "../constants/media.constants"
import type {
  HlsTranscodeJob,
  ImageCaptureJob,
  VideoEncoder,
  VideoEncoding,
} from "../types/media.types"

/** Peak and buffer sizes relative to the target bitrate, for steady HLS segments. */
const MAX_RATE_FACTOR = 1.07
const BUFFER_SIZE_FACTOR = 1.5
const JPEG_QUALITY = "3"
/** Renditions never play faster than this, and sources that do not state a rate get the fallback. */
const MAX_FRAME_RATE = 60
const FALLBACK_FRAME_RATE = 30
/** JPEG needs full-range colour; ffmpeg 8 refuses the limited range videos use. */
const TO_JPEG_COLOURS = "out_range=full,format=yuvj420p"
/** Seconds ffmpeg waits at most between attempts to reconnect to a source URL. */
const RECONNECT_DELAY_MAX_SECONDS = "10"

const COMMON_ARGS = ["-hide_banner", "-loglevel", "error", "-nostdin", "-y"]

/** Progress as `key=value` lines on standard output; see `parseFfmpegProgressLine`. */
const PROGRESS_ARGS = ["-progress", "pipe:1", "-nostats"]

const isUrl = (source: string) => /^https?:\/\//.test(source)

/** A source URL is read with range requests, reconnecting when the connection drops. */
const inputArgs = (source: string) => [
  ...(isUrl(source)
    ? [
        "-reconnect",
        "1",
        "-reconnect_on_network_error",
        "1",
        "-reconnect_delay_max",
        RECONNECT_DELAY_MAX_SECONDS,
      ]
    : []),
  "-i",
  source,
]

/**
 * Decoding on the GPU next to its encoder; frames come back to memory for
 * the scale filters, and sources the GPU cannot decode fall back to the CPU.
 */
const hardwareDecodeArgs = (encoder: VideoEncoder) =>
  match(encoder)
    .with(VIDEO_ENCODERS.X264, () => [])
    .with(VIDEO_ENCODERS.VIDEOTOOLBOX, () => ["-hwaccel", "videotoolbox"])
    .with(VIDEO_ENCODERS.NVENC, () => ["-hwaccel", "cuda"])
    .exhaustive()

/** H.264 Main with keyframes forced on segment boundaries, so every rendition switches cleanly. */
const videoEncoderArgs = (
  { encoder, x264Preset }: VideoEncoding,
  segmentSeconds: number
) => {
  const forcedKeyFrames = [
    "-force_key_frames",
    `expr:gte(t,n_forced*${segmentSeconds})`,
  ]
  const common = ["-profile:v", "main", "-pix_fmt", "yuv420p"]

  return match(encoder)
    .with(VIDEO_ENCODERS.X264, () => [
      "-c:v",
      "libx264",
      "-preset",
      x264Preset,
      "-sc_threshold",
      "0",
      ...common,
      ...forcedKeyFrames,
    ])
    .with(VIDEO_ENCODERS.VIDEOTOOLBOX, () => [
      "-c:v",
      "h264_videotoolbox",
      // Falls back to Apple's software encoder when the hardware is busy or missing.
      "-allow_sw",
      "1",
      ...common,
      ...forcedKeyFrames,
    ])
    .with(VIDEO_ENCODERS.NVENC, () => [
      "-c:v",
      "h264_nvenc",
      "-preset",
      "p4",
      "-rc",
      "vbr",
      "-no-scenecut",
      "1",
      "-forced-idr",
      "1",
      ...common,
      ...forcedKeyFrames,
    ])
    .exhaustive()
}

/**
 * One ffmpeg run that decodes the source once and writes every rendition as
 * HLS (H.264 and AAC in MPEG-TS) with a master playlist, and the storyboard:
 * a grid of frames taken every `intervalSeconds`.
 */
export function buildHlsTranscodeArgs(
  job: HlsTranscodeJob,
  encoding: VideoEncoding
) {
  const count = job.renditions.length
  const { storyboard } = job
  const splitLabels = [
    ...job.renditions.map((_, index) => `[s${index}]`),
    "[board]",
  ].join("")
  const scaleFilters = job.renditions.map(
    ({ width, height }, index) =>
      `[s${index}]scale=${width}:${height},setsar=1[v${index}]`
  )
  const storyboardFilter = `[board]fps=1/${storyboard.intervalSeconds},scale=${storyboard.tileWidth}:${storyboard.tileHeight}:${TO_JPEG_COLOURS},tile=${storyboard.columns}x${storyboard.rows}[storyboard]`
  // A constant rate fills the gaps of variable-rate sources, such as screen
  // recordings that store no frames while nothing moves: browsers stall at
  // a gap in an HLS stream instead of playing through it.
  const frameRate = Math.min(
    job.sourceFrameRate ?? FALLBACK_FRAME_RATE,
    MAX_FRAME_RATE
  )
  const filterGraph = [
    `[0:v:0]fps=${frameRate},split=${count + 1}${splitLabels}`,
    ...scaleFilters,
    storyboardFilter,
  ].join(";")

  const renditionArgs = job.renditions.flatMap((rendition, index) => [
    "-map",
    `[v${index}]`,
    `-b:v:${index}`,
    `${rendition.videoBitrateKbps}k`,
    `-maxrate:v:${index}`,
    `${Math.round(rendition.videoBitrateKbps * MAX_RATE_FACTOR)}k`,
    `-bufsize:v:${index}`,
    `${Math.round(rendition.videoBitrateKbps * BUFFER_SIZE_FACTOR)}k`,
    ...(job.hasAudio
      ? ["-map", "0:a:0", `-b:a:${index}`, `${rendition.audioBitrateKbps}k`]
      : []),
  ])
  const streamMap = job.renditions
    .map(({ name }, index) =>
      job.hasAudio
        ? `v:${index},a:${index},name:${name}`
        : `v:${index},name:${name}`
    )
    .join(" ")

  return [
    ...COMMON_ARGS,
    ...PROGRESS_ARGS,
    ...hardwareDecodeArgs(encoding.encoder),
    ...inputArgs(job.source),
    "-filter_complex",
    filterGraph,
    ...renditionArgs,
    ...videoEncoderArgs(encoding, job.segmentSeconds),
    ...(job.hasAudio ? ["-c:a", "aac", "-ac", "2"] : []),
    "-f",
    "hls",
    "-hls_time",
    String(job.segmentSeconds),
    "-hls_playlist_type",
    "vod",
    "-hls_flags",
    "independent_segments",
    "-hls_segment_type",
    "mpegts",
    "-hls_segment_filename",
    `${job.outputDir}/%v/${job.segmentFilePattern}`,
    "-master_pl_name",
    job.masterPlaylistName,
    "-var_stream_map",
    streamMap,
    `${job.outputDir}/%v/${job.variantPlaylistName}`,
    "-map",
    "[storyboard]",
    "-frames:v",
    "1",
    "-q:v",
    JPEG_QUALITY,
    storyboard.outputPath,
  ]
}

/** Seeks before decoding, so only the frames near `atSeconds` are read. */
export function buildImageCaptureArgs(job: ImageCaptureJob) {
  return [
    ...COMMON_ARGS,
    "-ss",
    job.atSeconds.toFixed(3),
    ...inputArgs(job.source),
    "-frames:v",
    "1",
    "-vf",
    `scale=${job.width}:${job.height}:${TO_JPEG_COLOURS}`,
    "-q:v",
    JPEG_QUALITY,
    job.outputPath,
  ]
}

export const buildProbeArgs = (source: string) => [
  "-v",
  "error",
  "-print_format",
  "json",
  "-show_streams",
  "-show_format",
  ...(isUrl(source) ? ["-reconnect", "1"] : []),
  source,
]

/** Removes the query of URLs in ffmpeg's messages, as a signed URL's query is a credential. */
export const redactUrlQueries = (text: string) =>
  text.replace(/(https?:\/\/[^\s?'"]+)\?[^\s'"]+/g, "$1?…")
