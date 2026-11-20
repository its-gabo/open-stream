import { PLAYLIST_LIMITS } from "@workspace/shared"

/** Bodies the API refuses before looking at the library's videos. */
export const INVALID_PLAYLIST_BODIES = [
  { description: "a blank title", body: { title: "   " } },
  {
    description: "a title over the limit",
    body: { title: "x".repeat(PLAYLIST_LIMITS.TITLE_MAX_LENGTH + 1) },
  },
  {
    description: "a description over the limit",
    body: {
      title: "Course",
      description: "x".repeat(PLAYLIST_LIMITS.DESCRIPTION_MAX_LENGTH + 1),
    },
  },
  {
    description: "a video id that is not a UUID",
    body: { title: "Course", videoIds: ["lesson-1"] },
  },
] as const

/** Video lists refused before the videos are looked up. */
export const INVALID_VIDEO_LISTS = [
  {
    description: "the same video twice",
    videoIds: [
      "0b6f3c8e-5d0a-4b8e-9f3c-1a2b3c4d5e6f",
      "0b6f3c8e-5d0a-4b8e-9f3c-1a2b3c4d5e6f",
    ],
  },
  {
    description: "more videos than allowed",
    videoIds: Array.from(
      { length: PLAYLIST_LIMITS.MAX_VIDEOS + 1 },
      (_, index) => `0b6f3c8e-5d0a-4b8e-9f3c-${String(index).padStart(12, "0")}`
    ),
  },
] as const
