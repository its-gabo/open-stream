import { VIDEO_CHAPTER_LIMITS } from "@workspace/shared"

/** Chapter lists the API refuses before looking at the video; the fake toolkit's videos last 3 seconds. */
export const INVALID_CHAPTER_LISTS = [
  {
    description: "a first chapter after 0:00",
    chapters: [{ title: "Intro", startSeconds: 1 }],
  },
  {
    description: "two chapters at the same time",
    chapters: [
      { title: "Intro", startSeconds: 0 },
      { title: "Setup", startSeconds: 1 },
      { title: "Again", startSeconds: 1 },
    ],
  },
  {
    description: "a chapter shorter than a second",
    chapters: [
      { title: "Intro", startSeconds: 0 },
      { title: "Blink", startSeconds: 1 },
      { title: "Setup", startSeconds: 1.5 },
    ],
  },
  {
    description: "chapters out of order",
    chapters: [
      { title: "Intro", startSeconds: 0 },
      { title: "Later", startSeconds: 2 },
      { title: "Earlier", startSeconds: 1 },
    ],
  },
  {
    description: "a blank title",
    chapters: [{ title: "   ", startSeconds: 0 }],
  },
  {
    description: "a title over the limit",
    chapters: [
      {
        title: "x".repeat(VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH + 1),
        startSeconds: 0,
      },
    ],
  },
  {
    description: "a negative start",
    chapters: [
      { title: "Intro", startSeconds: 0 },
      { title: "Before", startSeconds: -1 },
    ],
  },
  {
    description: "more chapters than allowed",
    chapters: Array.from(
      { length: VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO + 1 },
      (_, index) => ({ title: `Part ${index + 1}`, startSeconds: index })
    ),
  },
] as const
