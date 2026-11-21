import { VIDEO_CAPTION_LIMITS } from "@workspace/shared"
import {
  formatWebVttTimestamp,
  toWebVttCueText,
} from "../../libraries/utils/webvtt.utils"
import { CAPTION_ALLOWED_TAGS } from "../constants/captions.constants"
import type { CaptionCue } from "../types/captions.types"

const TIMING_LINE =
  /^\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/

const TAG = /<[^>]*>/g

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&lrm;": "‎",
  "&rlm;": "‏",
}

/** `[hh:]mm:ss.ttt`, with a comma as SRT writes it, in seconds. */
const parseTimestamp = (text: string) => {
  const [clock, fraction = "0"] = text.replace(",", ".").split(".")
  const parts = clock!.split(":").map(Number)
  const [hours, minutes, seconds] =
    parts.length === 3 ? parts : [0, parts[0], parts[1]]

  if (minutes! >= 60 || seconds! >= 60) return null

  return hours! * 3600 + minutes! * 60 + seconds! + Number(`0.${fraction}`)
}

const decodeEntities = (text: string) =>
  text.replace(/&(amp|lt|gt|nbsp|lrm|rlm);/g, (entity) => ENTITIES[entity]!)

/**
 * A cue's text with only the markup players show safely: bold, italic,
 * underline and voice tags. Other tags, e.g. SRT's `<font>`, and ASS
 * positioning like `{\an8}` are removed; everything else is escaped.
 */
export function sanitizeCueText(text: string) {
  const lines = text
    .replace(/\{\\[^}]*\}/g, "")
    .split("\n")
    .map((line) => {
      const tags = line.match(TAG) ?? []

      return line
        .split(TAG)
        .map(
          (part, index) =>
            `${toWebVttCueText(decodeEntities(part))}${keepAllowedTag(tags[index])}`
        )
        .join("")
        .trim()
    })
    .filter((line) => line.length > 0)

  return lines.join("\n").slice(0, VIDEO_CAPTION_LIMITS.CUE_TEXT_MAX_LENGTH)
}

const keepAllowedTag = (tag: string | undefined) => {
  if (!tag) return ""

  const simple = tag.match(/^<(\/?)([a-z]+)>$/i)

  if (
    simple &&
    CAPTION_ALLOWED_TAGS.some((name) => name === simple[2]!.toLowerCase())
  ) {
    return `<${simple[1]}${simple[2]!.toLowerCase()}>`
  }

  if (/^<\/v>$/i.test(tag)) return "</v>"

  const voice = tag.match(/^<v(?:\.[\w.-]+)?\s+([^>]+)>$/i)

  return voice ? `<v ${voice[1]!.replace(/[<>&]/g, "").trim()}>` : ""
}

/** Text without its markup, to tell whether a cue says anything. */
const toPlainText = (text: string) => text.replace(TAG, "").trim()

/**
 * The cues of a WebVTT or SRT file, sorted by start, sanitized, and kept
 * inside the video's duration. Blocks without a valid timing, e.g. notes
 * and styles, are skipped. Null when the file has no cue at all.
 */
export function parseCaptionFile(
  content: string,
  durationSeconds: number
): CaptionCue[] | null {
  const blocks = content
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)

  const cues: CaptionCue[] = []

  for (const block of blocks) {
    const lines = block.split("\n")
    const timingIndex = lines.findIndex((line) => TIMING_LINE.test(line))

    if (timingIndex === -1 || timingIndex > 1) continue

    const [, startText, endText] = lines[timingIndex]!.match(TIMING_LINE)!
    const startSeconds = parseTimestamp(startText!)
    const endSeconds = parseTimestamp(endText!)
    const text = sanitizeCueText(lines.slice(timingIndex + 1).join("\n"))

    if (
      startSeconds === null ||
      endSeconds === null ||
      endSeconds <= startSeconds ||
      startSeconds >= durationSeconds ||
      !toPlainText(text)
    ) {
      continue
    }

    cues.push({
      startSeconds,
      endSeconds: Math.min(endSeconds, durationSeconds),
      text,
    })
  }

  return cues.length > 0
    ? cues.sort((left, right) => left.startSeconds - right.startSeconds)
    : null
}

/** A WebVTT file of `cues`, which must already be sanitized. */
export function buildCaptionVtt(cues: CaptionCue[]) {
  return [
    "WEBVTT",
    "",
    ...cues.flatMap(({ startSeconds, endSeconds, text }) => [
      `${formatWebVttTimestamp(startSeconds)} --> ${formatWebVttTimestamp(endSeconds)}`,
      text,
      "",
    ]),
  ].join("\n")
}
