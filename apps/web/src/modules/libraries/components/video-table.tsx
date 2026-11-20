import { VIDEO_STATUSES } from "@workspace/shared"
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
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  LoaderCircleIcon,
  RefreshCwIcon,
  RotateCwIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useVideoUpload } from "../hooks/use-video-upload"
import {
  LOCAL_UPLOAD_STATUSES,
  VIDEO_FILE_ACCEPT,
  REPROCESSABLE_STATUSES,
} from "../libraries.constants"
import { validateVideoFile } from "../libraries.utils"
import { useVideoUploadStore } from "../video-upload.store"
import { VideoThumbnail } from "./video-thumbnail"
import { VideoUploadState } from "./video-upload-state"

import type { Video } from "@/api/generated-api"

import { useVideoDeleteMutation } from "@/api/mutations/libraries/useVideoDeleteMutation"
import { useVideoReprocessMutation } from "@/api/mutations/libraries/useVideoReprocessMutation"

type VideoTableProps = {
  organizationSlug: string
  libraryId: string
  videos: Video[]
  /** Opens the video's details sheet. */
  onOpenVideo: (videoId: string) => void
}

export function VideoTable({
  organizationSlug,
  libraryId,
  videos,
  onOpenVideo,
}: VideoTableProps) {
  const { t, i18n } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [videoForFile, setVideoForFile] = useState<Video | null>(null)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)
  const localUploads = useVideoUploadStore((state) => state.uploads)
  const { startVideoUpload, cancelVideoUpload } = useVideoUpload()

  const { mutate: deleteVideo, isPending: isDeletePending } =
    useVideoDeleteMutation(organizationSlug, libraryId, {
      onSuccess: () => setVideoToDelete(null),
    })

  const {
    mutate: reprocessVideo,
    isPending: isReprocessPending,
    variables: reprocessedVideoId,
  } = useVideoReprocessMutation(organizationSlug, libraryId)

  const chooseFileFor = (video: Video) => {
    setVideoForFile(video)
    fileInputRef.current?.click()
  }

  const handleFileChosen = (file: File | undefined) => {
    if (fileInputRef.current) fileInputRef.current.value = ""

    if (!file || !videoForFile) return

    const fileError = validateVideoFile(file, t)

    if (fileError) {
      toast.error(fileError)
      return
    }

    startVideoUpload(
      { organizationSlug, libraryId, videoId: videoForFile.id },
      file
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={VIDEO_FILE_ACCEPT}
        className="hidden"
        onChange={(event) => handleFileChosen(event.target.files?.[0])}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 sm:pl-5">
              {t("videos.columns.title")}
            </TableHead>
            <TableHead>{t("videos.columns.state")}</TableHead>
            <TableHead>{t("videos.columns.created")}</TableHead>
            <TableHead className="w-0 pr-4 sm:pr-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => {
            const localUpload = localUploads[video.id]
            const isUploadingHere =
              localUpload?.status === LOCAL_UPLOAD_STATUSES.UPLOADING
            const canReceiveFile =
              !isUploadingHere && video.status !== VIDEO_STATUSES.UPLOADED

            const canResumeUpload =
              video.status === VIDEO_STATUSES.UPLOADING &&
              video.importHost === null

            return (
              <TableRow
                key={video.id}
                className="cursor-pointer"
                onClick={() => onOpenVideo(video.id)}
              >
                <TableCell className="max-w-72 pl-4 sm:pl-5">
                  <div className="flex items-center gap-3">
                    <VideoThumbnail
                      organizationSlug={organizationSlug}
                      libraryId={libraryId}
                      video={video}
                    />
                    <button
                      type="button"
                      className="truncate text-left font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenVideo(video.id)
                      }}
                    >
                      {video.title}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="min-w-48">
                  <VideoUploadState video={video} localUpload={localUpload} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: "medium",
                  }).format(new Date(video.createdAt))}
                </TableCell>
                <TableCell
                  className="pr-4 sm:pr-5"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end gap-1">
                    {isUploadingHere && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("videos.actions.cancel_upload")}
                        title={t("videos.actions.cancel_upload")}
                        onClick={() =>
                          void cancelVideoUpload({
                            organizationSlug,
                            libraryId,
                            videoId: video.id,
                          })
                        }
                      >
                        <XIcon />
                      </Button>
                    )}
                    {canReceiveFile && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={
                          canResumeUpload
                            ? t("videos.actions.resume_upload")
                            : t("videos.actions.upload_file")
                        }
                        title={
                          canResumeUpload
                            ? t("videos.actions.resume_upload")
                            : t("videos.actions.upload_file")
                        }
                        onClick={() => chooseFileFor(video)}
                      >
                        {canResumeUpload ? <RotateCwIcon /> : <UploadIcon />}
                      </Button>
                    )}
                    {REPROCESSABLE_STATUSES.has(video.processingStatus) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("videos.actions.reprocess")}
                        title={t("videos.actions.reprocess")}
                        disabled={isReprocessPending}
                        onClick={() => reprocessVideo(video.id)}
                      >
                        {isReprocessPending &&
                        reprocessedVideoId === video.id ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : (
                          <RefreshCwIcon />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("videos.actions.delete")}
                      title={t("videos.actions.delete")}
                      disabled={isUploadingHere}
                      onClick={() => setVideoToDelete(video)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={Boolean(videoToDelete)}
        onOpenChange={(open) => {
          if (!open) setVideoToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("videos.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("videos.delete.description", {
                title: videoToDelete?.title ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (videoToDelete) deleteVideo(videoToDelete.id)
              }}
            >
              {isDeletePending && <LoaderCircleIcon className="animate-spin" />}
              {t("videos.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
