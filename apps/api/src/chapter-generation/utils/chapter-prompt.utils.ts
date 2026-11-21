import { countTokens } from "gpt-tokenizer/encoding/o200k_base"
import {
  CHAPTER_GENERATION_INPUT_TOKEN_MARGIN,
  CHAPTER_GENERATION_INSTRUCTIONS,
  CHAPTER_GENERATION_REQUEST_OVERHEAD_TOKENS,
} from "../constants/chapter-generation.constants"
import type { TranscriptLine } from "../types/chapter-generation.types"
import { maxSuggestedChapters } from "./chapter-suggestion.utils"
import { formatTranscript } from "./chapter-transcript.utils"

/** What the model is asked, after `CHAPTER_GENERATION_INSTRUCTIONS`. */
export const buildChapterPrompt = (
  transcript: TranscriptLine[],
  durationSeconds: number
) =>
  [
    `The video lasts ${Math.floor(durationSeconds)} seconds.`,
    `Propose at most ${maxSuggestedChapters(durationSeconds)} chapters.`,
    "",
    "Transcript:",
    formatTranscript(transcript),
  ].join("\n")

/**
 * The tokens a model reads for `prompt`, counted with OpenAI's o200k
 * tokenizer: its instructions and text, the request's framing and schema,
 * and a margin for servers that split text differently.
 */
export const estimatePromptTokens = (prompt: string) =>
  Math.ceil(
    (countTokens(CHAPTER_GENERATION_INSTRUCTIONS) + countTokens(prompt)) *
      CHAPTER_GENERATION_INPUT_TOKEN_MARGIN
  ) + CHAPTER_GENERATION_REQUEST_OVERHEAD_TOKENS
