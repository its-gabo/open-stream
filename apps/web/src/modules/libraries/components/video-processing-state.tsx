import { VIDEO_PROCESSING_STATUSES } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { LoaderCircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import type { Video } from "@/api/generated-api"

type VideoProcessingStateProps = {
  video: Video
}

/** Transcoding of an uploaded video: waiting, running, playable in its qualities, or failed. */
export function VideoProcessingState({ video }: VideoProcessingStateProps) {
  const { t } = useTranslation()

  return match(video.processingStatus)
    .with(VIDEO_PROCESSING_STATUSES.READY, () => (
      <Badge
        variant="secondary"
        title={video.renditions.map(({ quality }) => quality).join(", ")}
      >
        {t("videos.processing.ready")}
      </Badge>
    ))
    .with(VIDEO_PROCESSING_STATUSES.FAILED, () => (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="destructive">{t("videos.processing.failed")}</Badge>
        {video.processingFailureReason && (
          <p className="text-xs text-muted-foreground">
            {t(
              `videos.processing.failure_reasons.${video.processingFailureReason}`
            )}
          </p>
        )}
      </div>
    ))
    .with(VIDEO_PROCESSING_STATUSES.PROCESSING, () => (
      <Badge variant="outline">
        <LoaderCircleIcon className="animate-spin" />
        {t("videos.processing.processing")}
      </Badge>
    ))
    .with(VIDEO_PROCESSING_STATUSES.PENDING, null, () => (
      <Badge variant="outline">
        <LoaderCircleIcon className="animate-spin" />
        {t("videos.processing.pending")}
      </Badge>
    ))
    .exhaustive()
}
