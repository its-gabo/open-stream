import { Button } from "@workspace/ui/components/button"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { useVideoUpload } from "../hooks/use-video-upload"
import { LOCAL_UPLOAD_STATUSES } from "../libraries.constants"
import { toUploadPercentage } from "../libraries.utils"
import { UploadProgressBar } from "./upload-progress-bar"

import type { LocalVideoUpload } from "../libraries.types"

import { resolveApiToastMessage } from "@/lib/api-toast-message"
import { API_TOAST_MESSAGE_TYPE } from "@/lib/api-toast-message.constants"

type VideoUploadsListProps = {
  uploads: LocalVideoUpload[]
}

export function VideoUploadsList({ uploads }: VideoUploadsListProps) {
  const { t } = useTranslation()
  const { cancelVideoUpload, dismissVideoUpload } = useVideoUpload()

  return (
    <>
      <p className="border-b px-4 py-2.5 font-heading font-semibold">
        {t("videos.uploads_panel.title")}
      </p>
      <ul className="max-h-72 divide-y overflow-y-auto">
        {uploads.map((upload) => {
          const percentage = toUploadPercentage(
            upload.bytesUploaded,
            upload.bytesTotal
          )

          return (
            <li key={upload.videoId} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                {match(upload.status)
                  .with(LOCAL_UPLOAD_STATUSES.UPLOADING, () => (
                    <LoaderCircleIcon className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  ))
                  .with(LOCAL_UPLOAD_STATUSES.COMPLETED, () => (
                    <CircleCheckIcon className="size-4 shrink-0 text-primary" />
                  ))
                  .with(LOCAL_UPLOAD_STATUSES.FAILED, () => (
                    <CircleAlertIcon className="size-4 shrink-0 text-destructive" />
                  ))
                  .exhaustive()}
                <span className="min-w-0 flex-1 truncate">
                  {upload.fileName}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {match(upload.status)
                    .with(
                      LOCAL_UPLOAD_STATUSES.UPLOADING,
                      () => `${percentage}%`
                    )
                    .with(LOCAL_UPLOAD_STATUSES.COMPLETED, () =>
                      t("videos.uploads_panel.completed")
                    )
                    .with(LOCAL_UPLOAD_STATUSES.FAILED, () =>
                      t("videos.uploads_panel.failed")
                    )
                    .exhaustive()}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={
                    upload.status === LOCAL_UPLOAD_STATUSES.UPLOADING
                      ? t("videos.actions.cancel_upload")
                      : t("videos.uploads_panel.dismiss")
                  }
                  onClick={() =>
                    upload.status === LOCAL_UPLOAD_STATUSES.UPLOADING
                      ? void cancelVideoUpload(upload)
                      : dismissVideoUpload(upload.videoId)
                  }
                >
                  <XIcon />
                </Button>
              </div>
              {upload.status === LOCAL_UPLOAD_STATUSES.UPLOADING && (
                <UploadProgressBar percentage={percentage} />
              )}
              {upload.status === LOCAL_UPLOAD_STATUSES.FAILED && (
                <p className="pl-6 text-xs text-destructive">
                  {resolveApiToastMessage(
                    { code: upload.errorCode },
                    t,
                    API_TOAST_MESSAGE_TYPE.ERROR
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
