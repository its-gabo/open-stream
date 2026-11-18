import {
  LIBRARY_API_KEY_SCOPES,
  VIEWER_DEVICE_TYPES,
  type LibraryPlayerSettings,
} from "@workspace/shared"

/** Every seeded account signs in with this password. */
export const SEED_PASSWORD = "openstream-dev"

export const SEED_USERS = {
  OWNER: { name: "Olivia Owner", email: "owner@openstream.local" },
  MEMBER: { name: "Mark Member", email: "member@openstream.local" },
} as const

export const SEED_ORGANIZATION = { name: "Acme Media", slug: "acme-media" }

/** How a seeded video's file is made; `null` leaves the video a draft without one. */
export type SeedVideoFile = {
  /** An ffmpeg lavfi video source; `null` makes an audio-only file, which processing rejects. */
  pattern: string | null
  width: number
  height: number
  seconds: number
  toneHz: number
}

export type SeedVideo = {
  title: string
  file: SeedVideoFile | null
  /** Views spread over the last `SEED_VIEW_DAYS` days, if it plays. */
  viewCount: number
}

export type SeedLibrary = {
  name: string
  security?: { allowedPlaybackHosts: string[]; requireSignedPlayback: boolean }
  player?: LibraryPlayerSettings
  /** Hosts the seeded views were embedded on; `null` is a view without one. */
  embeddingHosts: (string | null)[]
  videos: SeedVideo[]
}

export const SEED_LIBRARIES: SeedLibrary[] = [
  {
    name: "Product demos",
    embeddingHosts: ["www.example.com", "blog.example.com", null],
    videos: [
      {
        title: "Dashboard walkthrough",
        file: {
          pattern: "testsrc2",
          width: 1280,
          height: 720,
          seconds: 20,
          toneHz: 440,
        },
        viewCount: 120,
      },
      {
        title: "Mobile app preview",
        file: {
          pattern: "testsrc",
          width: 720,
          height: 1280,
          seconds: 12,
          toneHz: 523,
        },
        viewCount: 60,
      },
      {
        title: "Feature launch teaser",
        file: {
          pattern: "smptehdbars",
          width: 1920,
          height: 1080,
          seconds: 10,
          toneHz: 659,
        },
        viewCount: 90,
      },
      {
        title: "Podcast episode (audio only)",
        file: {
          pattern: null,
          width: 0,
          height: 0,
          seconds: 8,
          toneHz: 330,
        },
        viewCount: 0,
      },
      { title: "Upcoming release notes", file: null, viewCount: 0 },
    ],
  },
  {
    name: "Online courses",
    security: {
      allowedPlaybackHosts: ["courses.example.com", "*.example.com"],
      requireSignedPlayback: true,
    },
    player: {
      accentColor: "#f97316",
      showTitle: true,
      showSettingsMenu: true,
      showPictureInPicture: false,
      showFullscreen: true,
    },
    embeddingHosts: ["courses.example.com", "learn.example.com"],
    videos: [
      {
        title: "Lesson 1: Getting started",
        file: {
          pattern: "rgbtestsrc",
          width: 1280,
          height: 720,
          seconds: 30,
          toneHz: 392,
        },
        viewCount: 150,
      },
      {
        title: "Lesson 2: Uploading videos",
        file: {
          pattern: "testsrc2",
          width: 854,
          height: 480,
          seconds: 25,
          toneHz: 494,
        },
        viewCount: 80,
      },
    ],
  },
]

export const SEED_API_KEY = {
  name: "Seed key",
  scopes: Object.values(LIBRARY_API_KEY_SCOPES),
}

export const SEED_VIEW_DAYS = 30

/** Desktop views are the most common, as in most libraries. */
export const SEED_DEVICE_TYPES = [
  VIEWER_DEVICE_TYPES.DESKTOP,
  VIEWER_DEVICE_TYPES.DESKTOP,
  VIEWER_DEVICE_TYPES.DESKTOP,
  VIEWER_DEVICE_TYPES.MOBILE,
  VIEWER_DEVICE_TYPES.MOBILE,
  VIEWER_DEVICE_TYPES.TABLET,
]
