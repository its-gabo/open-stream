import {
  VIDEO_CHAPTER_LIMITS,
  latestChapterStartSeconds,
  type VideoChapter,
} from "@workspace/shared"
import { SUGGESTED_CHAPTER_MIN_SECONDS } from "../constants/chapter-generation.constants"
import type { ProposedChapter } from "../types/chapter-generation.types"

/** How many chapters a video of this length may be given, each at least `SUGGESTED_CHAPTER_MIN_SECONDS` long. */
export const maxSuggestedChapters = (durationSeconds: number) =>
  Math.max(
    1,
    Math.min(
      VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO,
      Math.floor(durationSeconds / SUGGESTED_CHAPTER_MIN_SECONDS)
    )
  )

const toTitle = (title: string) =>
  title
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH)
    .trim()

/** The cue start nearest to `seconds`, so a chapter begins where a sentence does; `seconds` itself without cues. */
const toNearestStart = (seconds: number, cueStarts: number[]) =>
  cueStarts.reduce<number | null>(
    (nearest, start) =>
      nearest === null ||
      Math.abs(start - seconds) < Math.abs(nearest - seconds)
        ? start
        : nearest,
    null
  ) ?? seconds

/**
 * Turns what a model proposed into chapters the video accepts: those that
 * start within it moved to the nearest cue start, sorted, the first at
 * 0:00, later ones at least `SUGGESTED_CHAPTER_MIN_SECONDS` apart and early
 * enough to last until the video ends, titles trimmed to the limit and
 * empty ones left out.
 */
export function toSuggestedChapters(
  proposed: ProposedChapter[],
  {
    durationSeconds,
    cueStarts,
  }: { durationSeconds: number; cueStarts: number[] }
): VideoChapter[] {
  const latestStart = latestChapterStartSeconds(durationSeconds)
  const candidates = proposed
    .filter(
      ({ startSeconds }) =>
        Number.isFinite(startSeconds) && startSeconds <= latestStart
    )
    .map(({ startSeconds, title }) => ({
      title: toTitle(title),
      startSeconds:
        Math.round(
          toNearestStart(Math.max(0, startSeconds), cueStarts) * 1000
        ) / 1000,
    }))
    .filter(
      ({ title, startSeconds }) => title !== "" && startSeconds <= latestStart
    )
    .sort((first, second) => first.startSeconds - second.startSeconds)

  const chapters: VideoChapter[] = []

  for (const candidate of candidates) {
    const previous = chapters.at(-1)

    if (!previous) {
      chapters.push({ ...candidate, startSeconds: 0 })
    } else if (
      candidate.startSeconds - previous.startSeconds >=
      SUGGESTED_CHAPTER_MIN_SECONDS
    ) {
      chapters.push(candidate)
    }
  }

  return chapters.slice(0, VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO)
}
