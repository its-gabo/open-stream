import { VIDEO_QUALITIES } from "@workspace/shared"

const ALL_QUALITIES = Object.values(VIDEO_QUALITIES)

export const RENDITION_PLANS = [
  {
    description: "a 1080p source gets every quality",
    qualities: ALL_QUALITIES,
    source: { width: 1920, height: 1080 },
    expected: [
      { quality: "360p", width: 640, height: 360 },
      { quality: "480p", width: 854, height: 480 },
      { quality: "720p", width: 1280, height: 720 },
      { quality: "1080p", width: 1920, height: 1080 },
    ],
  },
  {
    description: "qualities above a 720p source are skipped",
    qualities: ALL_QUALITIES,
    source: { width: 1280, height: 720 },
    expected: [
      { quality: "360p", width: 640, height: 360 },
      { quality: "480p", width: 854, height: 480 },
      { quality: "720p", width: 1280, height: 720 },
    ],
  },
  {
    description: "a source just under a quality still counts as it",
    qualities: [VIDEO_QUALITIES.P720],
    source: { width: 1280, height: 704 },
    expected: [{ quality: "720p", width: 1280, height: 704 }],
  },
  {
    description: "a portrait source is measured on its short side",
    qualities: [VIDEO_QUALITIES.P360, VIDEO_QUALITIES.P1080],
    source: { width: 1080, height: 1920 },
    expected: [
      { quality: "360p", width: 360, height: 640 },
      { quality: "1080p", width: 1080, height: 1920 },
    ],
  },
  {
    description: "a source below every chosen quality keeps its own size",
    qualities: [VIDEO_QUALITIES.P720, VIDEO_QUALITIES.P1080],
    source: { width: 426, height: 240 },
    expected: [{ quality: "720p", width: 426, height: 240 }],
  },
] as const

export const PROBE_OUTPUTS = [
  {
    description: "a landscape video with audio",
    output: {
      streams: [
        { codec_type: "video", codec_name: "h264", width: 1920, height: 1080 },
        { codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "12.5" },
    },
    expected: {
      durationSeconds: 12.5,
      width: 1920,
      height: 1080,
      videoCodec: "h264",
      audioCodec: "aac",
    },
  },
  {
    description: "a phone video rotated by its display matrix",
    output: {
      streams: [
        {
          codec_type: "video",
          codec_name: "hevc",
          width: 1920,
          height: 1080,
          side_data_list: [{ rotation: -90 }],
        },
      ],
      format: { duration: "3" },
    },
    expected: {
      durationSeconds: 3,
      width: 1080,
      height: 1920,
      videoCodec: "hevc",
      audioCodec: null,
    },
  },
] as const
