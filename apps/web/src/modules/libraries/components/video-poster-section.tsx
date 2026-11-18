import {
  VIDEO_POSTER_IMAGE_LIMITS,
  VIDEO_POSTER_SOURCES,
} from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { ImageUpIcon, RotateCcwIcon, ScanIcon } from "lucide-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { match } from "ts-pattern"

import { VIDEO_POSTER_IMAGE_ACCEPT } from "../libraries.constants"
import {
  buildVideoPosterUrl,
  formatFileSize,
  formatPlaybackTime,
} from "../libraries.utils"

import type { Video } from "@/api/generated-api"
import { useVideoPosterImageUploadMutation } from "@/api/mutations/libraries/useVideoPosterImageUploadMutation"
import { useVideoPosterUpdateMutation } from "@/api/mutations/libraries/useVideoPosterUpdateMutation"

type VideoPosterSectionProps = {
  organizationSlug: string
  libraryId: string
  /** A processed video. */
  video: Video
  /** Where the player above is, as the frame to use. */
  currentSeconds: number
}

/** The poster players show before a video starts: a frame of it, or an uploaded image. */
export function VideoPosterSection({
  organizationSlug,
  libraryId,
  video,
  currentSeconds,
}: VideoPosterSectionProps) {
  const { t, i18n } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const posterUpdate = useVideoPosterUpdateMutation(
    organizationSlug,
    libraryId,
    video.id
  )
  const imageUpload = useVideoPosterImageUploadMutation(
    organizationSlug,
    libraryId,
    video.id
  )
  const isSaving = posterUpdate.isPending || imageUpload.isPending
  const sourceDescription = match(video.poster)
    .with({ source: VIDEO_POSTER_SOURCES.AUTOMATIC }, () =>
      t("videos.poster.sources.automatic")
    )
    .with({ source: VIDEO_POSTER_SOURCES.FRAME }, ({ frameSeconds }) =>
      t("videos.poster.sources.frame", {
        time: formatPlaybackTime(frameSeconds ?? 0),
      })
    )
    .with({ source: VIDEO_POSTER_SOURCES.IMAGE }, () =>
      t("videos.poster.sources.image")
    )
    .exhaustive()

  const uploadImage = (file: File | undefined) => {
    if (!file) return

    if (file.size > VIDEO_POSTER_IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
      toast.error(
        t("videos.poster.image_too_large", {
          size: formatFileSize(
            VIDEO_POSTER_IMAGE_LIMITS.MAX_FILE_SIZE_BYTES,
            i18n.language
          ),
        })
      )

      return
    }

    imageUpload.mutate(file)
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {t("videos.poster.description")}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <img
          src={buildVideoPosterUrl(organizationSlug, libraryId, video)}
          alt={t("videos.poster.preview_alt")}
          className="aspect-video w-full rounded-lg border bg-muted object-contain sm:w-56"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm">{sourceDescription}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isSaving}
              onClick={() =>
                posterUpdate.mutate({
                  source: VIDEO_POSTER_SOURCES.FRAME,
                  atSeconds: currentSeconds,
                })
              }
            >
              <ScanIcon />
              {t("videos.poster.use_frame", {
                time: formatPlaybackTime(currentSeconds),
              })}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUpIcon />
              {t("videos.poster.upload_image")}
            </Button>
            {video.poster.source !== VIDEO_POSTER_SOURCES.AUTOMATIC && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isSaving}
                onClick={() =>
                  posterUpdate.mutate({
                    source: VIDEO_POSTER_SOURCES.AUTOMATIC,
                  })
                }
              >
                <RotateCcwIcon />
                {t("videos.poster.reset")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("videos.poster.image_hint", {
              size: formatFileSize(
                VIDEO_POSTER_IMAGE_LIMITS.MAX_FILE_SIZE_BYTES,
                i18n.language
              ),
            })}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_POSTER_IMAGE_ACCEPT}
            className="hidden"
            onChange={(event) => {
              uploadImage(event.target.files?.[0])
              // Lets the same file be picked again after a failed upload.
              event.target.value = ""
            }}
          />
        </div>
      </div>
    </section>
  )
}
