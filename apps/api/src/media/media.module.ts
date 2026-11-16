import { FfmpegMediaToolkitService } from "./services/ffmpeg-media-toolkit.service"
import type { MediaModuleDependencies } from "./types/media.types"

export function createMediaModule(dependencies: MediaModuleDependencies) {
  return {
    mediaToolkit:
      dependencies.mediaToolkit ??
      new FfmpegMediaToolkitService(dependencies.config),
  }
}

export type MediaModule = ReturnType<typeof createMediaModule>
