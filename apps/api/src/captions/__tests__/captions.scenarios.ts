/** Long enough for every cue below. */
export const VIDEO_DURATION_SECONDS = 60

export const ENGLISH_VTT = [
  "WEBVTT",
  "",
  "00:00:01.000 --> 00:00:03.000",
  "Hello <b>there</b>",
  "",
  "00:00:04.000 --> 00:00:06.500",
  "<script>alert(1)</script>Welcome",
  "",
].join("\n")

export const ENGLISH_VTT_STORED = [
  "WEBVTT",
  "",
  "00:00:01.000 --> 00:00:03.000",
  "Hello <b>there</b>",
  "",
  "00:00:04.000 --> 00:00:06.500",
  "alert(1)Welcome",
  "",
].join("\n")

export const POLISH_SRT = [
  "1",
  "00:00:01,000 --> 00:00:02,000",
  "Cześć",
  "",
  "2",
  "00:00:02,500 --> 00:00:04,000",
  '<font color="#fff">Witamy</font>',
  "",
].join("\r\n")

/** Files the API refuses, with the status it answers. */
export const INVALID_CAPTION_FILES = [
  { name: "plain text", content: "not captions at all", status: 422 },
  {
    name: "cues after the video ends",
    content: "WEBVTT\n\n00:02:00.000 --> 00:02:01.000\nToo late\n",
    status: 422,
  },
  {
    name: "bytes that are not text",
    content: new Uint8Array([0xff, 0xfe, 0x00, 0xd8, 0x00]),
    status: 422,
  },
  {
    name: "a file larger than allowed",
    content: `WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n${"x".repeat(2 * 1024 * 1024)}\n`,
    status: 413,
  },
] as const

/** Upload fields the API refuses before reading the file. */
export const INVALID_UPLOAD_FIELDS = [
  { language: "english", label: "English", kind: "subtitles" },
  { language: "en", label: "", kind: "subtitles" },
  { language: "en", label: "English", kind: "karaoke" },
] as const
