import { VIDEO_STATUSES } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { LOCAL_UPLOAD_STATUSES } from "../libraries.constants"
import { formatFileSize, toUploadPercentage } from "../libraries.utils"
import { UploadProgressBar } from "./upload-progress-bar"
import { VideoProcessingState } from "./video-processing-state"

import type { Video } from "@/api/generated-api"
import type { LocalVideoUpload } from "../libraries.types"

type VideoUploadStateProps = {
  video: Video
  /** The upload running in this tab, which is fresher than the polled video. */
  localUpload: LocalVideoUpload | undefined
}

/** Where the video's file is: waiting, uploading live, imported by the server, paused after a reload, rejected, or uploaded and being processed. */
export function VideoUploadState({
  video,
  localUpload,
}: VideoUploadStateProps) {
  const { t, i18n } = useTranslation()

  const formatProgress = (bytesUploaded: number, bytesTotal: number) =>
    t("videos.upload_state.progress", {
      uploaded: formatFileSize(bytesUploaded, i18n.language),
      total: formatFileSize(bytesTotal, i18n.language),
    })

  return match({ video, localUpload })
    .with(
      { localUpload: { status: LOCAL_UPLOAD_STATUSES.UPLOADING } },
      ({ localUpload: { bytesUploaded, bytesTotal } }) => {
        const percentage = toUploadPercentage(bytesUploaded, bytesTotal)

        return (
          <div className="flex min-w-40 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">
                {t("videos.upload_state.uploading", { percentage })}
              </span>
              <span className="text-muted-foreground">
                {formatProgress(bytesUploaded, bytesTotal)}
              </span>
            </div>
            <UploadProgressBar percentage={percentage} />
          </div>
        )
      }
    )
    .with(
      { video: { status: VIDEO_STATUSES.UPLOADING, importHost: P.string } },
      ({ video: { importHost, uploadedBytes, sizeBytes } }) => (
        <div className="flex min-w-40 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium">
              {t("videos.upload_state.importing", { host: importHost })}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {sizeBytes === null
                ? formatFileSize(uploadedBytes, i18n.language)
                : formatProgress(uploadedBytes, sizeBytes)}
            </span>
          </div>
          <UploadProgressBar
            percentage={toUploadPercentage(uploadedBytes, sizeBytes ?? 0)}
          />
        </div>
      )
    )
    .with(
      { video: { status: VIDEO_STATUSES.UPLOADING, sizeBytes: P.number } },
      ({ video: { uploadedBytes, sizeBytes } }) => {
        const percentage = toUploadPercentage(uploadedBytes, sizeBytes)

        return (
          <div className="flex min-w-40 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">
                {t("videos.upload_state.paused", { percentage })}
              </span>
              <span className="text-muted-foreground">
                {formatProgress(uploadedBytes, sizeBytes)}
              </span>
            </div>
            <UploadProgressBar percentage={percentage} isPaused />
            <p className="text-xs text-muted-foreground">
              {t("videos.upload_state.paused_hint")}
            </p>
          </div>
        )
      }
    )
    .with(
      { video: { status: VIDEO_STATUSES.UPLOADED } },
      ({ video: uploadedVideo }) => (
        <VideoProcessingState video={uploadedVideo} />
      )
    )
    .with(
      { video: { status: VIDEO_STATUSES.FAILED } },
      ({ video: failedVideo }) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="destructive">{t("videos.status.failed")}</Badge>
          {failedVideo.failureReason && (
            <p className="text-xs text-muted-foreground">
              {t(`videos.failure_reasons.${failedVideo.failureReason}`)}
            </p>
          )}
        </div>
      )
    )
    .otherwise(() => (
      <Badge variant="outline">{t("videos.status.draft")}</Badge>
    ))
}
