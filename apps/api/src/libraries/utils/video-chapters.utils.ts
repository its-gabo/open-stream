import { latestChapterStartSeconds, type VideoChapter } from "@workspace/shared"
import { formatWebVttTimestamp, toWebVttCueText } from "./webvtt.utils"

/** The chapters that still last the minimum length before the video ends, e.g. after it was processed again from a shorter file. */
export const keepChaptersWithin = (
  chapters: VideoChapter[],
  durationSeconds: number
) =>
  chapters.filter(
    ({ startSeconds }) =>
      startSeconds <= latestChapterStartSeconds(durationSeconds)
  )

/** A WebVTT chapters track: one cue per chapter, from its start to the next one's, the last to the end of the video. */
export function buildChaptersVtt(
  chapters: VideoChapter[],
  durationSeconds: number
) {
  const cues = chapters.map(({ title, startSeconds }, index) => {
    const endSeconds = chapters[index + 1]?.startSeconds ?? durationSeconds

    return `${index + 1}\n${formatWebVttTimestamp(startSeconds)} --> ${formatWebVttTimestamp(endSeconds)}\n${toWebVttCueText(title)}`
  })

  return cues.length > 0 ? `WEBVTT\n\n${cues.join("\n\n")}\n` : "WEBVTT\n"
}
