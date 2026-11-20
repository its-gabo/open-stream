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
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { formatChapterTime, parseChapterList } from "../libraries.utils"

import { latestChapterStartSeconds, type VideoChapter } from "@workspace/shared"

type VideoChaptersPasteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Whether chapters are listed already, which the pasted ones replace. */
  replacesChapters: boolean
  /** Chapters too close to its end to last the minimum length are left out. */
  durationSeconds: number
  onApply: (chapters: VideoChapter[]) => void
}

const LIST_FIELD_ID = "video-chapters-paste"

/** Turns a pasted list such as a video description's `0:00 Intro` lines into chapters, showing what it found. */
export function VideoChaptersPasteDialog({
  open,
  onOpenChange,
  replacesChapters,
  durationSeconds,
  onApply,
}: VideoChaptersPasteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <ChapterListForm
          replacesChapters={replacesChapters}
          durationSeconds={durationSeconds}
          onApply={(chapters) => {
            onApply(chapters)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ChapterListForm({
  replacesChapters,
  durationSeconds,
  onApply,
}: Pick<
  VideoChaptersPasteDialogProps,
  "replacesChapters" | "durationSeconds" | "onApply"
>) {
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const parsedChapters = parseChapterList(text)
  const isWithinVideo = ({ startSeconds }: VideoChapter) =>
    startSeconds <= latestChapterStartSeconds(durationSeconds)
  const chapters = parsedChapters.filter(isWithinVideo)

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onApply(chapters)
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("videos.chapters.paste_dialog.title")}</DialogTitle>
        <DialogDescription>
          {t("videos.chapters.paste_dialog.description")}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={LIST_FIELD_ID}>
          {t("videos.chapters.paste_dialog.label")}
        </Label>
        <Textarea
          id={LIST_FIELD_ID}
          autoFocus
          rows={6}
          spellCheck={false}
          className="max-h-60 font-mono text-xs"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      {parsedChapters.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {t("videos.chapters.paste_dialog.found", {
              count: parsedChapters.length,
            })}
          </p>
          <ol className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md bg-muted/50 p-2 text-sm">
            {parsedChapters.map((chapter, index) => (
              <li
                key={index}
                className={cn(
                  "flex gap-3",
                  !isWithinVideo(chapter) && "text-destructive"
                )}
              >
                <span
                  className={cn(
                    "w-14 shrink-0 tabular-nums",
                    isWithinVideo(chapter) && "text-muted-foreground"
                  )}
                >
                  {formatChapterTime(chapter.startSeconds)}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    !isWithinVideo(chapter) && "line-through"
                  )}
                >
                  {chapter.title}
                </span>
                {!isWithinVideo(chapter) && (
                  <span className="shrink-0 text-xs">
                    {t("videos.chapters.paste_dialog.after_end")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      {chapters.length < parsedChapters.length && (
        <p className="text-xs text-destructive">
          {t("videos.chapters.paste_dialog.skipped", {
            count: parsedChapters.length - chapters.length,
            duration: formatChapterTime(durationSeconds),
          })}
        </p>
      )}
      {replacesChapters && (
        <p className="text-xs text-muted-foreground">
          {t("videos.chapters.paste_dialog.replaces")}
        </p>
      )}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="ghost" />}>
          {t("common.cancel")}
        </DialogClose>
        <Button type="submit" disabled={chapters.length === 0}>
          {t("videos.chapters.paste_dialog.apply", { count: chapters.length })}
        </Button>
      </DialogFooter>
    </form>
  )
}
