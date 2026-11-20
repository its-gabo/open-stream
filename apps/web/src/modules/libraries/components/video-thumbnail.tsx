import { VIDEO_PROCESSING_STATUSES } from "@workspace/shared"
import { FilmIcon } from "lucide-react"

import { buildVideoPosterUrl, formatDuration } from "../libraries.utils"

import type { Video } from "@/api/generated-api"

type VideoThumbnailProps = {
  organizationSlug: string
  libraryId: string
  video: Video
}

/** A processed video's poster with its duration, or a placeholder until it is processed. */
export function VideoThumbnail({
  organizationSlug,
  libraryId,
  video,
}: VideoThumbnailProps) {
  return (
    <span className="relative flex aspect-video w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
      {video.processingStatus === VIDEO_PROCESSING_STATUSES.READY ? (
        <img
          src={buildVideoPosterUrl(organizationSlug, libraryId, video)}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <FilmIcon className="size-4" />
      )}
      {video.durationSeconds !== null && (
        <span className="absolute right-0.5 bottom-0.5 rounded bg-black/75 px-1 text-[10px] leading-4 font-medium text-white tabular-nums">
          {formatDuration(video.durationSeconds)}
        </span>
      )}
    </span>
  )
}
