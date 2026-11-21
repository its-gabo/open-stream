import type { ValueOf } from "../../common/types/common.types"
import type { AppConfig } from "../../config/app.config"
import type { VIDEO_ENCODERS, X264_PRESETS } from "../constants/media.constants"

/** What a media file holds, as far as transcoding needs to know. */
export type MediaProbe = {
  durationSeconds: number
  /** Displayed size, after any rotation. */
  width: number
  height: number
  videoCodec: string
  audioCodec: string | null
  /** Average frames per second; null when the file does not say. */
  frameRate: number | null
}

export type HlsRenditionOutput = {
  name: string
  width: number
  height: number
  videoBitrateKbps: number
  audioBitrateKbps: number
}

/** A grid of evenly spaced frames in one image, written by the same run as the renditions. */
export type StoryboardOutput = {
  outputPath: string
  intervalSeconds: number
  tileWidth: number
  tileHeight: number
  columns: number
  rows: number
}

/**
 * One decode of the source into every rendition and the storyboard. The
 * source is a local path or a URL ffmpeg reads with range requests.
 */
export type HlsTranscodeJob = {
  source: string
  outputDir: string
  renditions: HlsRenditionOutput[]
  hasAudio: boolean
  /** The source's average frame rate; the renditions get a constant one from it. */
  sourceFrameRate: number | null
  segmentSeconds: number
  masterPlaylistName: string
  variantPlaylistName: string
  segmentFilePattern: string
  storyboard: StoryboardOutput
  /** Called as ffmpeg reports how many seconds of the source it has transcoded. */
  onProgress?: (processedSeconds: number) => void
}

export type ImageCaptureJob = {
  /** A local path or a URL. */
  source: string
  outputPath: string
  atSeconds: number
  width: number
  height: number
}

/** An image file as a JPEG, scaled down to fit `maxLongSide` but never up. */
export type ImageConversionJob = {
  /** A local path. */
  source: string
  outputPath: string
  maxLongSide: number
}

/**
 * The source's sound as small mono MP3 files of at most `chunkSeconds`
 * each, for speech recognition services that limit the size of a file.
 */
export type AudioExtractionJob = {
  /** A local path or a URL. */
  source: string
  outputDir: string
  chunkSeconds: number
}

/** A piece of extracted audio and where it starts in the source. */
export type AudioChunk = {
  path: string
  startSeconds: number
}

/** Reads and transcodes media files, from the local disk or a URL. */
export type MediaToolkit = {
  /** Null when the file has no video stream. */
  probe(source: string): Promise<MediaProbe | null>
  transcodeToHls(job: HlsTranscodeJob): Promise<void>
  captureImage(job: ImageCaptureJob): Promise<void>
  convertImage(job: ImageConversionJob): Promise<void>
  /** In order; the source must have sound. */
  extractAudioChunks(job: AudioExtractionJob): Promise<AudioChunk[]>
}

export type MediaModuleDependencies = {
  config: AppConfig
  /** Replaces ffmpeg, e.g. in tests. */
  mediaToolkit?: MediaToolkit
}

export type VideoEncoder = ValueOf<typeof VIDEO_ENCODERS>
export type X264Preset = ValueOf<typeof X264_PRESETS>

/** How the renditions are encoded, from the config. */
export type VideoEncoding = {
  encoder: VideoEncoder
  x264Preset: X264Preset
}
