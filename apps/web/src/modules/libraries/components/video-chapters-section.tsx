import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { VIDEO_CHAPTER_LIMITS } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  ClipboardPasteIcon,
  LoaderCircleIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useStoryboard } from "../hooks/use-storyboard"
import {
  CHAPTER_THUMBNAIL_WIDTHS,
  VIDEO_PLAYER_PATHS,
} from "../libraries.constants"
import { videoChaptersFormSchema } from "../libraries.schemas"
import {
  buildVideoFileUrl,
  findStoryboardCue,
  formatChapterTime,
  parseChapterTime,
} from "../libraries.utils"
import { StoryboardTile } from "./storyboard-tile"
import { VideoChaptersPasteDialog } from "./video-chapters-paste-dialog"
import { VideoChaptersSuggestDialog } from "./video-chapters-suggest-dialog"

import type { VideoChapter } from "@workspace/shared"
import type { Video } from "@/api/generated-api"
import type {
  VideoChaptersFormInput,
  VideoChaptersFormValues,
} from "../libraries.types"
import { useVideoChaptersUpdateMutation } from "@/api/mutations/libraries/useVideoChaptersUpdateMutation"

type VideoChaptersSectionProps = {
  organizationSlug: string
  libraryId: string
  /** A processed video. */
  video: Video
  /** Where the player above is, as the start of a new chapter. */
  currentSeconds: number
}

const toFormValues = (chapters: VideoChapter[]): VideoChaptersFormInput => ({
  chapters: chapters.map(({ title, startSeconds }) => ({
    time: formatChapterTime(startSeconds),
    title,
  })),
})

/**
 * A video's chapters, one row each: typed, added at the player's position,
 * pasted as a list like `0:00 Intro`, or suggested from a caption track by
 * the library's provider. Saving replaces all of them.
 */
export function VideoChaptersSection({
  organizationSlug,
  libraryId,
  video,
  currentSeconds,
}: VideoChaptersSectionProps) {
  const { t } = useTranslation()
  const durationSeconds = video.durationSeconds ?? 0
  const form = useForm<
    VideoChaptersFormInput,
    unknown,
    VideoChaptersFormValues
  >({
    resolver: standardSchemaResolver(
      videoChaptersFormSchema(t, durationSeconds)
    ),
    mode: "onChange",
    defaultValues: toFormValues(video.chapters),
  })
  const { fields, insert, move, remove, replace } = useFieldArray({
    control: form.control,
    name: "chapters",
  })
  const rows = form.watch("chapters")
  const chapterErrors = form.formState.errors.chapters
  const isAtLimit = fields.length >= VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO
  const [isPasteOpen, setIsPasteOpen] = useState(false)
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const storyboard = useStoryboard(
    buildVideoFileUrl(
      organizationSlug,
      libraryId,
      video,
      VIDEO_PLAYER_PATHS.STORYBOARD
    )
  )
  const { mutateAsync: updateChapters, isPending } =
    useVideoChaptersUpdateMutation(organizationSlug, libraryId, video.id)
  // The first chapter has to start at 0:00, so an empty list gets that one first.
  const newChapterSeconds = fields.length === 0 ? 0 : currentSeconds

  const addChapter = () => {
    const index = rows.filter(
      ({ time }) => (parseChapterTime(time) ?? 0) <= newChapterSeconds
    ).length

    insert(index, { time: formatChapterTime(newChapterSeconds), title: "" })
  }

  /** Moves a row with both its start and title filled in to its place in time order. */
  const sortRow = (index: number) => {
    const current = form.getValues("chapters")
    const { time, title } = current[index]
    const start = parseChapterTime(time)

    if (start === null || !title.trim()) return

    const target = current.filter((other, rowIndex) => {
      const rowStart = parseChapterTime(other.time)

      return rowIndex !== index && rowStart !== null && rowStart < start
    }).length

    if (target !== index) move(index, target)
  }

  /** Pasted or suggested chapters replace the rows, to review before saving. */
  const applyChapters = (chapters: VideoChapter[]) => {
    replace(toFormValues(chapters).chapters)
    void form.trigger("chapters")
  }

  const saveChapters = form.handleSubmit(async ({ chapters }) => {
    const { data } = await updateChapters({ chapters })

    form.reset(toFormValues(data.video.chapters))
  })

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {t("videos.chapters.description")}
      </p>
      <form className="flex flex-col gap-4" noValidate onSubmit={saveChapters}>
        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t("videos.chapters.empty")}
          </p>
        ) : (
          <ol className="flex flex-col divide-y rounded-lg border">
            {fields.map((field, index) => {
              const errors = chapterErrors?.[index]
              const start = parseChapterTime(rows[index]?.time ?? "")
              const cue =
                start === null
                  ? undefined
                  : findStoryboardCue(storyboard, start)

              return (
                <li
                  key={field.id}
                  className="flex flex-col gap-1 px-3 py-2"
                  onBlur={(event) => {
                    // Only once focus leaves the row, not when moving from its time to its title.
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      sortRow(index)
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {cue ? (
                      <StoryboardTile
                        cue={cue}
                        width={CHAPTER_THUMBNAIL_WIDTHS.EDITOR}
                        className="hidden rounded sm:block"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="hidden aspect-video shrink-0 rounded bg-muted sm:block"
                        style={{ width: CHAPTER_THUMBNAIL_WIDTHS.EDITOR }}
                      />
                    )}
                    <Input
                      className="w-24 shrink-0 font-mono text-xs"
                      placeholder="0:00"
                      autoComplete="off"
                      spellCheck={false}
                      inputMode="decimal"
                      aria-invalid={Boolean(errors?.time) || undefined}
                      aria-label={t("videos.chapters.time_label", {
                        number: index + 1,
                      })}
                      {...form.register(`chapters.${index}.time`, {
                        deps: ["chapters"],
                      })}
                    />
                    <Input
                      placeholder={t("videos.chapters.title_placeholder")}
                      autoComplete="off"
                      maxLength={VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH}
                      aria-invalid={Boolean(errors?.title) || undefined}
                      aria-label={t("videos.chapters.title_label", {
                        number: index + 1,
                      })}
                      {...form.register(`chapters.${index}.title`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("videos.chapters.remove", {
                        title: rows[index]?.title || index + 1,
                      })}
                      onClick={() => remove(index)}
                    >
                      <XIcon />
                    </Button>
                  </div>
                  {(errors?.time ?? errors?.title) && (
                    <p className="text-xs text-destructive">
                      {(errors.time ?? errors.title)?.message}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        )}
        {chapterErrors?.root?.message && (
          <p className="text-xs text-destructive">
            {chapterErrors.root.message}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isAtLimit}
            title={
              isAtLimit
                ? t("validation.chapters.too_many", {
                    max: VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO,
                  })
                : undefined
            }
            onClick={addChapter}
          >
            <PlusIcon />
            {t("videos.chapters.add_at", {
              time: formatChapterTime(newChapterSeconds),
            })}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsPasteOpen(true)}
          >
            <ClipboardPasteIcon />
            {t("videos.chapters.paste")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsSuggestOpen(true)}
          >
            <SparklesIcon />
            {t("videos.chapters.suggest.trigger")}
          </Button>
          {fields.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => replace([])}
            >
              <Trash2Icon />
              {t("videos.chapters.remove_all")}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="ml-auto"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("videos.chapters.save")}
          </Button>
        </div>
      </form>
      <VideoChaptersPasteDialog
        open={isPasteOpen}
        onOpenChange={setIsPasteOpen}
        replacesChapters={fields.length > 0}
        durationSeconds={durationSeconds}
        onApply={applyChapters}
      />
      <VideoChaptersSuggestDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        videoId={video.id}
        open={isSuggestOpen}
        onOpenChange={setIsSuggestOpen}
        replacesChapters={fields.length > 0}
        onApply={applyChapters}
      />
    </section>
  )
}
