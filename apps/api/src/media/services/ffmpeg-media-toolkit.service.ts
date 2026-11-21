import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import type { AppConfig } from "../../config/app.config"
import {
  AUDIO_CHUNK_LIST_NAME,
  AUDIO_CHUNK_PATTERN,
  ERROR_OUTPUT_TAIL_LENGTH,
} from "../constants/media.constants"
import type {
  AudioExtractionJob,
  HlsTranscodeJob,
  ImageCaptureJob,
  ImageConversionJob,
  MediaToolkit,
} from "../types/media.types"
import {
  buildAudioExtractionArgs,
  buildHlsTranscodeArgs,
  buildImageCaptureArgs,
  buildImageConversionArgs,
  buildProbeArgs,
  parseAudioChunkList,
  redactUrlQueries,
} from "../utils/ffmpeg-args.utils"
import { parseFfmpegProgressLine } from "../utils/ffmpeg-progress.utils"
import { parseFfprobeOutput } from "../utils/ffprobe.utils"
import { assertOutputWritten, readLines } from "../utils/process-output.utils"

/** Runs the ffmpeg and ffprobe binaries named in the config. */
export class FfmpegMediaToolkitService implements MediaToolkit {
  constructor(private readonly config: AppConfig) {}

  async probe(source: string) {
    const output = await this.run(
      this.config.FFPROBE_PATH,
      buildProbeArgs(source)
    )

    return parseFfprobeOutput(output)
  }

  async transcodeToHls(job: HlsTranscodeJob) {
    await Promise.all([
      ...job.renditions.map(({ name }) =>
        mkdir(`${job.outputDir}/${name}`, { recursive: true })
      ),
      mkdir(dirname(job.storyboard.outputPath), { recursive: true }),
    ])

    let transcodedSeconds = 0

    await this.run(
      this.config.FFMPEG_PATH,
      buildHlsTranscodeArgs(job, {
        encoder: this.config.VIDEO_ENCODER,
        x264Preset: this.config.VIDEO_X264_PRESET,
      }),
      (line, { restartStallTimer }) => {
        const processedSeconds = parseFfmpegProgressLine(line)

        // ffmpeg keeps reporting while it waits on the source, so only a
        // report that moved forward counts as progress.
        if (processedSeconds === null || processedSeconds <= transcodedSeconds)
          return

        transcodedSeconds = processedSeconds
        restartStallTimer()
        job.onProgress?.(processedSeconds)
      }
    )
    await assertOutputWritten(job.storyboard.outputPath)
  }

  async captureImage(job: ImageCaptureJob) {
    await mkdir(dirname(job.outputPath), { recursive: true })
    await this.run(this.config.FFMPEG_PATH, buildImageCaptureArgs(job))
    await assertOutputWritten(job.outputPath)
  }

  async convertImage(job: ImageConversionJob) {
    await mkdir(dirname(job.outputPath), { recursive: true })
    await this.run(this.config.FFMPEG_PATH, buildImageConversionArgs(job))
    await assertOutputWritten(job.outputPath)
  }

  async extractAudioChunks(job: AudioExtractionJob) {
    const listPath = `${job.outputDir}/${AUDIO_CHUNK_LIST_NAME}`

    await mkdir(job.outputDir, { recursive: true })
    await this.run(
      this.config.FFMPEG_PATH,
      buildAudioExtractionArgs(job, {
        listPath,
        chunkPattern: `${job.outputDir}/${AUDIO_CHUNK_PATTERN}`,
      })
    )

    const list = Bun.file(listPath)

    return (await list.exists())
      ? parseAudioChunkList(await list.text(), job.outputDir)
      : []
  }

  /**
   * Resolves with standard output, passing each line to `onOutputLine` as it
   * arrives; rejects with the end of standard error when the command fails.
   */
  private async run(
    command: string,
    args: string[],
    onOutputLine?: (
      line: string,
      progress: { restartStallTimer: () => void }
    ) => void
  ) {
    const timeoutMs = this.config.FFMPEG_STALL_TIMEOUT_MS
    const child = Bun.spawn([command, ...args], {
      stdout: "pipe",
      stderr: "pipe",
    })
    let stallTimer: Timer | undefined
    let rejectStalled: (error: Error) => void = () => {}
    // Settles as soon as the command is killed: its output may stay open
    // meanwhile, e.g. held by a process it started.
    const stalled = new Promise<never>((_, reject) => {
      rejectStalled = reject
    })
    const restartStallTimer = () => {
      clearTimeout(stallTimer)
      stallTimer = setTimeout(() => {
        child.kill("SIGKILL")
        rejectStalled(
          new Error(
            `${command} made no progress for ${timeoutMs / 1000} seconds`
          )
        )
      }, timeoutMs)
    }

    restartStallTimer()

    try {
      const [output, errorOutput, exitCode] = await Promise.race([
        Promise.all([
          readLines(child.stdout, (line) =>
            onOutputLine?.(line, { restartStallTimer })
          ),
          new Response(child.stderr).text(),
          child.exited,
        ]),
        stalled,
      ])

      if (exitCode !== 0) {
        throw new Error(
          `${command} exited with ${exitCode}: ${redactUrlQueries(errorOutput.slice(-ERROR_OUTPUT_TAIL_LENGTH))}`
        )
      }

      return output
    } finally {
      clearTimeout(stallTimer)
    }
  }
}
