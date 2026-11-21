import { toWebVttCueText } from "../../libraries/utils/webvtt.utils"
import { TRANSCRIPT_CUE_LAYOUT } from "../constants/captions.constants"
import type { CaptionCue, TranscriptSegment } from "../types/captions.types"

/** Words filled into lines of at most `MAX_LINE_LENGTH`; a longer word gets a line of its own. */
const wrapIntoLines = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((lines, word) => {
      const last = lines.at(-1)

      if (
        last !== undefined &&
        last.length + 1 + word.length <= TRANSCRIPT_CUE_LAYOUT.MAX_LINE_LENGTH
      ) {
        return [...lines.slice(0, -1), `${last} ${word}`]
      }

      return [...lines, word]
    }, [])

/**
 * One segment's words as cues of at most `MAX_LINES` lines; a long segment
 * is split, its time shared out by how much text each cue holds.
 */
const toSegmentCues = (segment: TranscriptSegment): CaptionCue[] => {
  const lines = wrapIntoLines(toWebVttCueText(segment.text))
  const groups: string[][] = []

  for (
    let index = 0;
    index < lines.length;
    index += TRANSCRIPT_CUE_LAYOUT.MAX_LINES
  ) {
    groups.push(lines.slice(index, index + TRANSCRIPT_CUE_LAYOUT.MAX_LINES))
  }

  const totalLength = groups.reduce(
    (sum, group) => sum + group.join(" ").length,
    0
  )
  const duration = segment.endSeconds - segment.startSeconds
  let startSeconds = segment.startSeconds

  return groups.map((group, index) => {
    const endSeconds =
      index === groups.length - 1
        ? segment.endSeconds
        : startSeconds + (duration * group.join(" ").length) / totalLength
    const cue = { startSeconds, endSeconds, text: group.join("\n") }

    startSeconds = endSeconds

    return cue
  })
}

/**
 * Cues from the segments a provider heard, in order and within the video:
 * segments without words are dropped, overlaps are trimmed so one cue
 * shows at a time, and every cue lasts long enough to read.
 */
export function buildTranscriptCues(
  segments: TranscriptSegment[],
  durationSeconds: number
): CaptionCue[] {
  const cues = segments
    .filter(({ text }) => text.trim().length > 0)
    .map((segment) => ({
      ...segment,
      startSeconds: Math.max(0, segment.startSeconds),
      endSeconds: Math.min(
        durationSeconds,
        Math.max(
          segment.endSeconds,
          segment.startSeconds + TRANSCRIPT_CUE_LAYOUT.MIN_SECONDS
        )
      ),
    }))
    .filter(({ startSeconds }) => startSeconds < durationSeconds)
    .sort((left, right) => left.startSeconds - right.startSeconds)
    .flatMap(toSegmentCues)

  return cues
    .map((cue, index) => {
      const next = cues[index + 1]

      return next && next.startSeconds < cue.endSeconds
        ? { ...cue, endSeconds: next.startSeconds }
        : cue
    })
    .filter(({ startSeconds, endSeconds }) => endSeconds > startSeconds)
}
