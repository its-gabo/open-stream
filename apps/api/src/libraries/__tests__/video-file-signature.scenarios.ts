import { VIDEO_FILE_FORMATS } from "@workspace/shared"

import { VIDEO_FILE_HEADERS } from "../../../test/helpers/video-files"

export const VIDEO_FILE_SIGNATURES = [
  {
    description: "an MP4 file",
    header: VIDEO_FILE_HEADERS.MP4,
    format: VIDEO_FILE_FORMATS.MP4,
  },
  {
    description: "a QuickTime file",
    header: VIDEO_FILE_HEADERS.MOV,
    format: VIDEO_FILE_FORMATS.MOV,
  },
  {
    description: "a QuickTime file without an ftyp box",
    header: VIDEO_FILE_HEADERS.LEGACY_MOV,
    format: VIDEO_FILE_FORMATS.MOV,
  },
  {
    description: "M4A audio in an MP4 container",
    header: VIDEO_FILE_HEADERS.M4A,
    format: null,
  },
  {
    description: "a HEIC image",
    header: VIDEO_FILE_HEADERS.HEIC,
    format: null,
  },
  { description: "a PNG image", header: VIDEO_FILE_HEADERS.PNG, format: null },
  { description: "plain text", header: VIDEO_FILE_HEADERS.TEXT, format: null },
] as const
