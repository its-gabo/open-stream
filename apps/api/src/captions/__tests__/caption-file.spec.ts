import { describe, expect, it } from "bun:test"

import {
  buildCaptionVtt,
  parseCaptionFile,
  sanitizeCueText,
} from "../utils/caption-file.utils"
import {
  toCaptionLabel,
  toCaptionLanguage,
} from "../utils/caption-language.utils"
import { buildTranscriptCues } from "../utils/transcript-cues.utils"

describe("Caption files", () => {
  it("reads WebVTT cues, skipping the header, notes and styles", () => {
    const vtt = [
      "WEBVTT - Launch",
      "",
      "NOTE written by hand",
      "",
      "STYLE",
      "::cue { color: red }",
      "",
      "intro",
      "00:00:01.000 --> 00:00:02.500 align:start",
      "Hello",
      "there",
      "",
      "00:03.000 --> 00:04.000",
      "Short timing",
    ].join("\n")

    expect(parseCaptionFile(vtt, 60)).toEqual([
      { startSeconds: 1, endSeconds: 2.5, text: "Hello\nthere" },
      { startSeconds: 3, endSeconds: 4, text: "Short timing" },
    ])
  })

  it("reads SRT with Windows line endings and a byte order mark", () => {
    const srt =
      "﻿1\r\n00:00:01,000 --> 00:00:02,000\r\nFirst\r\n\r\n2\r\n00:00:00,500 --> 00:00:00,900\r\nEarlier\r\n"

    expect(parseCaptionFile(srt, 60)).toEqual([
      { startSeconds: 0.5, endSeconds: 0.9, text: "Earlier" },
      { startSeconds: 1, endSeconds: 2, text: "First" },
    ])
  })

  it("keeps cues within the video and drops those with bad timings or no words", () => {
    const srt = [
      "1",
      "00:00:01,000 --> 00:00:00,500",
      "Ends before it starts",
      "",
      "2",
      "00:00:01,000 --> 00:00:02,000",
      "<i></i>",
      "",
      "3",
      "00:00:09,000 --> 00:00:12,000",
      "Runs past the end",
      "",
      "4",
      "00:00:11,000 --> 00:00:12,000",
      "Starts after the end",
      "",
      "5",
      "00:00:01,000 --> 00:61:00,000",
      "Impossible minutes",
    ].join("\n")

    expect(parseCaptionFile(srt, 10)).toEqual([
      { startSeconds: 9, endSeconds: 10, text: "Runs past the end" },
    ])
  })

  it("finds nothing in a file that is not captions", () => {
    expect(parseCaptionFile("just some text\nnothing timed", 10)).toBeNull()
    expect(parseCaptionFile("", 10)).toBeNull()
  })

  it("keeps only safe markup in cue text", () => {
    expect(
      sanitizeCueText(
        '{\\an8}<font color="red">Red</font> <B>bold</B> <script>x</script> & <v.loud Ada>Hi</v>'
      )
    ).toBe("Red <b>bold</b> x &amp; <v Ada>Hi</v>")
    expect(sanitizeCueText("Tom &amp; Jerry &lt;3")).toBe(
      "Tom &amp; Jerry &lt;3"
    )
    expect(sanitizeCueText("a --> b")).toBe("a --&gt; b")
  })

  it("writes cues back as WebVTT", () => {
    expect(
      buildCaptionVtt([
        { startSeconds: 1, endSeconds: 2.25, text: "Hello" },
        { startSeconds: 3661.5, endSeconds: 3662, text: "Two\nlines" },
      ])
    ).toBe(
      "WEBVTT\n\n00:00:01.000 --> 00:00:02.250\nHello\n\n01:01:01.500 --> 01:01:02.000\nTwo\nlines\n"
    )
  })
})

describe("Transcript cues", () => {
  it("wraps long segments into cues of two lines, sharing out their time", () => {
    const text =
      "This sentence is long enough that it cannot fit into one line of a subtitle, nor into two of them, so it is split"
    const cues = buildTranscriptCues(
      [{ startSeconds: 10, endSeconds: 20, text }],
      60
    )

    expect(cues.length).toBe(2)
    expect(cues[0]!.startSeconds).toBe(10)
    expect(cues.at(-1)!.endSeconds).toBe(20)
    expect(cues[0]!.endSeconds).toBe(cues[1]!.startSeconds)

    for (const cue of cues) {
      const lines = cue.text.split("\n")

      expect(lines.length).toBeLessThanOrEqual(2)
      expect(lines.every((line) => line.length <= 42)).toBe(true)
    }

    expect(cues.map((cue) => cue.text.replace(/\n/g, " ")).join(" ")).toBe(text)
  })

  it("orders segments, trims overlaps, escapes text and drops silence", () => {
    expect(
      buildTranscriptCues(
        [
          { startSeconds: 5, endSeconds: 7, text: "Second <one>" },
          { startSeconds: 0, endSeconds: 6, text: " First " },
          { startSeconds: 8, endSeconds: 9, text: "   " },
          { startSeconds: 9.8, endSeconds: 9.8, text: "Late" },
          { startSeconds: 12, endSeconds: 13, text: "After the end" },
        ],
        10
      )
    ).toEqual([
      { startSeconds: 0, endSeconds: 5, text: "First" },
      { startSeconds: 5, endSeconds: 7, text: "Second &lt;one&gt;" },
      { startSeconds: 9.8, endSeconds: 10, text: "Late" },
    ])
  })
})

describe("Caption languages", () => {
  it("reads the languages providers report", () => {
    expect(toCaptionLanguage("english")).toBe("en")
    expect(toCaptionLanguage("Polish")).toBe("pl")
    expect(toCaptionLanguage("pt-br")).toBe("pt-BR")
    expect(toCaptionLanguage("klingon!")).toBeNull()
    expect(toCaptionLanguage(null)).toBeNull()
  })

  it("labels a track in its own language", () => {
    expect(toCaptionLabel("pl")).toBe("Polski")
    expect(toCaptionLabel("en")).toBe("English")
    expect(toCaptionLabel("und")).toBe("Unknown language")
  })
})
