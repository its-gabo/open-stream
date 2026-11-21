import type { CaptionCue } from "../../captions/types/captions.types"
import { CHAPTER_TRANSCRIPT_LAYOUT } from "../constants/chapter-generation.constants"
import type { TranscriptLine } from "../types/chapter-generation.types"

const TAG = /<[^>]*>/g

const toPlainText = (text: string) =>
  text
    .replace(TAG, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

/**
 * What a track says as lines of about `LINE_SECONDS` each, starting where
 * their first cue starts, without markup. Past `MAX_CHARACTERS` in all,
 * every line is shortened alike, so the whole video stays covered.
 */
export function toTranscriptLines(cues: CaptionCue[]): TranscriptLine[] {
  const lines: TranscriptLine[] = []

  for (const cue of cues) {
    const text = toPlainText(cue.text)

    if (!text) continue

    const current = lines.at(-1)

    if (
      current &&
      cue.startSeconds - current.startSeconds <
        CHAPTER_TRANSCRIPT_LAYOUT.LINE_SECONDS
    ) {
      current.text = `${current.text} ${text}`
    } else {
      lines.push({ startSeconds: cue.startSeconds, text })
    }
  }

  const totalCharacters = lines.reduce((sum, { text }) => sum + text.length, 0)

  if (totalCharacters <= CHAPTER_TRANSCRIPT_LAYOUT.MAX_CHARACTERS) return lines

  const charactersPerLine = Math.max(
    1,
    Math.floor(CHAPTER_TRANSCRIPT_LAYOUT.MAX_CHARACTERS / lines.length)
  )

  return lines.map(({ startSeconds, text }) => ({
    startSeconds,
    text: text.slice(0, charactersPerLine),
  }))
}

/** The transcript as the model reads it: one line each, after the whole second it starts at. */
export const formatTranscript = (lines: TranscriptLine[]) =>
  lines
    .map(({ startSeconds, text }) => `[${Math.floor(startSeconds)}] ${text}`)
    .join("\n")
