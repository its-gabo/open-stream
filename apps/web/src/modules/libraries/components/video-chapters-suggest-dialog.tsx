import { CHAPTER_GENERATION_MODEL } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
import { LoaderCircleIcon, SparklesIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { VideoCaption, VideoChapter } from "@/api/generated-api"

import { useVideoChapterSuggestionsMutation } from "@/api/mutations/libraries/useVideoChapterSuggestionsMutation"
import { useVideoCaptionsQuery } from "@/api/queries/libraries/useVideoCaptionsQuery"

type VideoChaptersSuggestDialogProps = {
  organizationSlug: string
  libraryId: string
  videoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Whether chapters are listed already, which the suggested ones replace. */
  replacesChapters: boolean
  onApply: (chapters: VideoChapter[]) => void
}

const TRACK_FIELD_ID = "video-chapters-suggest-track"

/** Asks the library's provider for chapters written from one of the video's caption tracks, to review before saving. */
export function VideoChaptersSuggestDialog({
  open,
  onOpenChange,
  ...props
}: VideoChaptersSuggestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <ChapterSuggestionForm
            {...props}
            onApply={(chapters) => {
              props.onApply(chapters)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** The default track first, as it is the one viewers see. */
const preferredTrack = (captions: VideoCaption[]): VideoCaption | undefined =>
  captions.find(({ isDefault }) => isDefault) ?? captions.at(0)

function ChapterSuggestionForm({
  organizationSlug,
  libraryId,
  videoId,
  replacesChapters,
  onApply,
}: Omit<VideoChaptersSuggestDialogProps, "open" | "onOpenChange">) {
  const { t } = useTranslation()
  const { data, isPending: isCaptionsPending } = useVideoCaptionsQuery(
    organizationSlug,
    libraryId,
    videoId
  )
  const captions = data?.captions ?? []
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(
    null
  )
  const captionId = selectedCaptionId || preferredTrack(captions)?.id || null
  const { mutate: suggestChapters, isPending } =
    useVideoChapterSuggestionsMutation(organizationSlug, libraryId, videoId)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()

        if (!captionId) return

        requestRef.current?.abort()
        const request = new AbortController()
        requestRef.current = request

        suggestChapters(
          { captionId, signal: request.signal },
          { onSuccess: onApply }
        )
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("videos.chapters.suggest.title")}</DialogTitle>
        <DialogDescription>
          {t("videos.chapters.suggest.description", {
            model: CHAPTER_GENERATION_MODEL,
          })}
        </DialogDescription>
      </DialogHeader>
      {!isCaptionsPending && captions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {t("videos.chapters.suggest.no_captions")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={TRACK_FIELD_ID}>
            {t("videos.chapters.suggest.track")}
          </Label>
          <SearchableSelect
            id={TRACK_FIELD_ID}
            value={captionId ?? ""}
            onValueChange={setSelectedCaptionId}
            options={captions.map(({ id, label, language }) => ({
              value: id,
              label: `${label} (${language})`,
            }))}
          />
        </div>
      )}
      {replacesChapters && (
        <p className="text-xs text-muted-foreground">
          {t("videos.chapters.suggest.replaces")}
        </p>
      )}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="ghost" />}>
          {t("common.cancel")}
        </DialogClose>
        <Button type="submit" disabled={!captionId || isPending}>
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SparklesIcon />
          )}
          {isPending
            ? t("videos.chapters.suggest.pending")
            : t("videos.chapters.suggest.submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}
