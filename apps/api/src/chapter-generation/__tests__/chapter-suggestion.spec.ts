import { describe, expect, it } from "bun:test"

import { VIDEO_CHAPTER_LIMITS } from "@workspace/shared"

import { countTokens } from "gpt-tokenizer/encoding/o200k_base"

import {
  CHAPTER_GENERATION_INPUT_TOKEN_MARGIN,
  CHAPTER_GENERATION_INSTRUCTIONS,
  CHAPTER_GENERATION_REQUEST_OVERHEAD_TOKENS,
  CHAPTER_TRANSCRIPT_LAYOUT,
} from "../constants/chapter-generation.constants"
import {
  buildChapterPrompt,
  estimatePromptTokens,
} from "../utils/chapter-prompt.utils"
import {
  maxSuggestedChapters,
  toSuggestedChapters,
} from "../utils/chapter-suggestion.utils"
import {
  formatTranscript,
  toTranscriptLines,
} from "../utils/chapter-transcript.utils"

const cue = (startSeconds: number, text: string) => ({
  startSeconds,
  endSeconds: startSeconds + 2,
  text,
})

describe("toTranscriptLines", () => {
  it("merges cues into lines, without markup, each starting at its first cue", () => {
    const lines = toTranscriptLines([
      cue(1, "Hello <b>there</b>"),
      cue(5, "and &amp; welcome"),
      cue(12, "   "),
      cue(25, "<v Ana>Next topic</v>"),
    ])

    expect(lines).toEqual([
      { startSeconds: 1, text: "Hello there and & welcome" },
      { startSeconds: 25, text: "Next topic" },
    ])
    expect(formatTranscript(lines)).toBe(
      "[1] Hello there and & welcome\n[25] Next topic"
    )
  })

  it("shortens every line alike when the transcript is too long, keeping all of them", () => {
    const longText = "word ".repeat(10_000).trim()
    const cues = Array.from({ length: 100 }, (_, index) =>
      cue(index * CHAPTER_TRANSCRIPT_LAYOUT.LINE_SECONDS, longText)
    )
    const lines = toTranscriptLines(cues)
    const totalCharacters = lines.reduce(
      (sum, { text }) => sum + text.length,
      0
    )

    expect(lines).toHaveLength(100)
    expect(totalCharacters).toBeLessThanOrEqual(
      CHAPTER_TRANSCRIPT_LAYOUT.MAX_CHARACTERS
    )
  })
})

describe("toSuggestedChapters", () => {
  const cueStarts = [1, 31.5, 62.25, 110]

  it("returns nothing when no proposal fits the video", () => {
    expect(
      toSuggestedChapters(
        [
          { startSeconds: Number.NaN, title: "Broken" },
          { startSeconds: 500, title: "Too late" },
        ],
        { durationSeconds: 120, cueStarts }
      )
    ).toEqual([])
  })

  it("starts the first chapter at 0:00 and cuts long titles to the limit", () => {
    const [chapter] = toSuggestedChapters(
      [{ startSeconds: 31, title: "x".repeat(300) }],
      { durationSeconds: 120, cueStarts }
    )

    expect(chapter).toEqual({
      startSeconds: 0,
      title: "x".repeat(VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH),
    })
  })

  it("keeps the proposed second when the track has no cues", () => {
    expect(
      toSuggestedChapters(
        [
          { startSeconds: 0, title: "Intro" },
          { startSeconds: 42.5, title: "Middle" },
        ],
        { durationSeconds: 120, cueStarts: [] }
      )
    ).toEqual([
      { startSeconds: 0, title: "Intro" },
      { startSeconds: 42.5, title: "Middle" },
    ])
  })
})

describe("maxSuggestedChapters", () => {
  it("allows one chapter per ten seconds, between one and the video's limit", () => {
    expect(maxSuggestedChapters(5)).toBe(1)
    expect(maxSuggestedChapters(120)).toBe(12)
    expect(maxSuggestedChapters(4 * 60 * 60)).toBe(
      VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO
    )
  })
})

describe("estimatePromptTokens", () => {
  it("counts the prompt and instructions with OpenAI's tokenizer, plus a margin and the request's overhead", () => {
    const prompt = buildChapterPrompt(
      [{ startSeconds: 0, text: "Hello and welcome to the course." }],
      60
    )
    const counted =
      countTokens(CHAPTER_GENERATION_INSTRUCTIONS) + countTokens(prompt)

    expect(estimatePromptTokens(prompt)).toBe(
      Math.ceil(counted * CHAPTER_GENERATION_INPUT_TOKEN_MARGIN) +
        CHAPTER_GENERATION_REQUEST_OVERHEAD_TOKENS
    )
  })
})
