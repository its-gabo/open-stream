import {
  VIDEO_CAPTION_LIMITS,
  VIDEO_CAPTION_SOURCES,
  VIDEO_TRANSCRIPTION_STATUSES,
} from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  CaptionsIcon,
  CircleAlertIcon,
  DownloadIcon,
  LoaderCircleIcon,
  PencilIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { buildVideoCaptionUrl, formatCaptionLanguage } from "../libraries.utils"
import { VideoCaptionEditDialog } from "./video-caption-edit-dialog"
import { VideoCaptionUploadDialog } from "./video-caption-upload-dialog"
import { VideoTranscriptionDialog } from "./video-transcription-dialog"

import type { Video, VideoCaption } from "@/api/generated-api"
import { useVideoCaptionDeleteMutation } from "@/api/mutations/libraries/useVideoCaptionDeleteMutation"
import { useVideoCaptionUpdateMutation } from "@/api/mutations/libraries/useVideoCaptionUpdateMutation"
import { useVideoCaptionsQuery } from "@/api/queries/libraries/useVideoCaptionsQuery"

type VideoCaptionsSectionProps = {
  organizationSlug: string
  libraryId: string
  /** A processed video. */
  video: Video
}

/**
 * A processed video's caption tracks: uploaded WebVTT or SRT files, and
 * tracks the library's provider transcribed. The latest transcription shows
 * while it runs, and why it failed when it did; the player above offers
 * the tracks.
 */
export function VideoCaptionsSection({
  organizationSlug,
  libraryId,
  video,
}: VideoCaptionsSectionProps) {
  const { t, i18n } = useTranslation()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isTranscribeOpen, setIsTranscribeOpen] = useState(false)
  const [captionToEdit, setCaptionToEdit] = useState<VideoCaption | null>(null)
  const [captionToDelete, setCaptionToDelete] = useState<VideoCaption | null>(
    null
  )
  const { data, isPending } = useVideoCaptionsQuery(
    organizationSlug,
    libraryId,
    video.id
  )
  const { mutate: updateCaption, isPending: isUpdatePending } =
    useVideoCaptionUpdateMutation(organizationSlug, libraryId, video.id)
  const { mutate: deleteCaption, isPending: isDeletePending } =
    useVideoCaptionDeleteMutation(organizationSlug, libraryId, video.id, {
      onSuccess: () => setCaptionToDelete(null),
    })
  const captions = data?.captions ?? []
  const latestTranscription = data?.transcriptions[0]
  const isTranscribing = match(latestTranscription?.status)
    .with(
      VIDEO_TRANSCRIPTION_STATUSES.PENDING,
      VIDEO_TRANSCRIPTION_STATUSES.PROCESSING,
      () => true
    )
    .otherwise(() => false)
  const isAtLimit = captions.length >= VIDEO_CAPTION_LIMITS.MAX_PER_VIDEO

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {t("videos.captions.description")}
      </p>
      {isTranscribing && (
        <Alert>
          <LoaderCircleIcon className="animate-spin" />
          <AlertTitle>{t("videos.captions.transcribing.title")}</AlertTitle>
          <AlertDescription>
            {t("videos.captions.transcribing.description")}
          </AlertDescription>
        </Alert>
      )}
      {latestTranscription?.status === VIDEO_TRANSCRIPTION_STATUSES.FAILED && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{t("videos.captions.failed.title")}</AlertTitle>
          <AlertDescription>
            {t(
              `videos.captions.failed.reasons.${latestTranscription.failureReason ?? "transcription_failed"}`
            )}
          </AlertDescription>
        </Alert>
      )}
      {isPending && <Skeleton className="h-16 w-full rounded-lg" />}
      {data && captions.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {t("videos.captions.empty")}
        </p>
      )}
      {captions.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border">
          {captions.map((caption) => (
            <li key={caption.id} className="flex items-center gap-3 px-3 py-2">
              <CaptionsIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {caption.label}
                  </span>
                  {caption.isDefault && (
                    <Badge variant="secondary">
                      {t("videos.captions.default")}
                    </Badge>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatCaptionLanguage(caption.language, i18n.language)} ·{" "}
                  {t(`videos.captions.kinds.${caption.kind}`)} ·{" "}
                  {caption.source === VIDEO_CAPTION_SOURCES.TRANSCRIPTION
                    ? t("videos.captions.sources.transcription")
                    : t("videos.captions.sources.upload")}{" "}
                  ·{" "}
                  {t("videos.captions.cue_count", { count: caption.cueCount })}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isUpdatePending}
                aria-pressed={caption.isDefault}
                aria-label={
                  caption.isDefault
                    ? t("videos.captions.unset_default", {
                        label: caption.label,
                      })
                    : t("videos.captions.set_default", {
                        label: caption.label,
                      })
                }
                title={
                  caption.isDefault
                    ? t("videos.captions.unset_default", {
                        label: caption.label,
                      })
                    : t("videos.captions.set_default", {
                        label: caption.label,
                      })
                }
                onClick={() =>
                  updateCaption({
                    captionId: caption.id,
                    label: caption.label,
                    isDefault: !caption.isDefault,
                  })
                }
              >
                <StarIcon className={caption.isDefault ? "fill-current" : ""} />
              </Button>
              <a
                href={buildVideoCaptionUrl(
                  organizationSlug,
                  libraryId,
                  video.id,
                  caption
                )}
                download={`${caption.language}-${caption.kind}.vtt`}
                aria-label={t("videos.captions.download", {
                  label: caption.label,
                })}
                title={t("videos.captions.download", { label: caption.label })}
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                })}
              >
                <DownloadIcon />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("videos.captions.rename", {
                  label: caption.label,
                })}
                onClick={() => setCaptionToEdit(caption)}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("videos.captions.delete", {
                  label: caption.label,
                })}
                onClick={() => setCaptionToDelete(caption)}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || isAtLimit}
          title={
            isAtLimit
              ? t("videos.captions.too_many", {
                  max: VIDEO_CAPTION_LIMITS.MAX_PER_VIDEO,
                })
              : undefined
          }
          onClick={() => setIsUploadOpen(true)}
        >
          <UploadIcon />
          {t("videos.captions.upload.trigger")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || isTranscribing}
          onClick={() => setIsTranscribeOpen(true)}
        >
          <SparklesIcon />
          {t("videos.captions.transcribe.trigger")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("videos.captions.edit_hint")}
      </p>
      <VideoCaptionUploadDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        videoId={video.id}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
      <VideoTranscriptionDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        videoId={video.id}
        open={isTranscribeOpen}
        onOpenChange={setIsTranscribeOpen}
      />
      <VideoCaptionEditDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        videoId={video.id}
        caption={captionToEdit}
        onClose={() => setCaptionToEdit(null)}
      />
      <AlertDialog
        open={Boolean(captionToDelete)}
        onOpenChange={(open) => {
          if (!open) setCaptionToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("videos.captions.delete_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("videos.captions.delete_description", {
                label: captionToDelete?.label ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (captionToDelete) deleteCaption(captionToDelete.id)
              }}
            >
              {t("videos.captions.delete_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
