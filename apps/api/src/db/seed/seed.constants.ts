import {
  LIBRARY_API_KEY_SCOPES,
  VIEWER_DEVICE_TYPES,
  VIDEO_CTA_KINDS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
  type LibraryPlayerSettings,
  type VideoChapter,
  type VideoCtaInput,
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
  description?: string
  file: SeedVideoFile | null
  /** Views spread over the last `SEED_VIEW_DAYS` days, if it plays. */
  viewCount: number
  chapters?: VideoChapter[]
  /** Shown to the seeded views that got far enough, some of which answered or closed them. */
  ctas?: VideoCtaInput[]
}

/**
 * A custom storage in its own bucket on the local S3 server, with a path
 * template other than the default one, so seeded videos show where a
 * custom layout puts them.
 */
export const SEED_STORAGE = {
  name: "Acme Media bucket",
  bucket: "acme-media-videos",
  pathTemplate: "videos/{year}/{month}/{libraryId}/{videoId}",
}

export type SeedLibrary = {
  name: string
  /** Stores its videos in `SEED_STORAGE` instead of the default storage. */
  usesSeedStorage?: boolean
  security?: { allowedPlaybackHosts: string[]; requireSignedPlayback: boolean }
  player?: LibraryPlayerSettings
  /** Hosts the seeded views were embedded on; `null` is a view without one. */
  embeddingHosts: (string | null)[]
  videos: SeedVideo[]
  playlist?: { title: string; description: string; videoTitles: string[] }
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
        chapters: [
          { title: "Introduction", startSeconds: 0 },
          { title: "Your libraries", startSeconds: 5 },
          { title: "Analytics", startSeconds: 12 },
        ],
        ctas: [
          {
            kind: VIDEO_CTA_KINDS.BUTTON,
            placement: VIDEO_CTA_PLACEMENTS.OVERLAY,
            startSeconds: 12,
            endSeconds: 19,
            timing: VIDEO_CTA_TIMINGS.FIXED,
            durationSeconds: null,
            heading: "Try OpenStream free",
            body: "Host your first videos in minutes. No card needed.",
            buttonLabel: "Start free trial",
            buttonUrl: "https://example.com/signup",
            consentText: null,
            dismissible: true,
          },
          {
            kind: VIDEO_CTA_KINDS.EMAIL,
            placement: VIDEO_CTA_PLACEMENTS.END_SCREEN,
            startSeconds: null,
            endSeconds: null,
            timing: VIDEO_CTA_TIMINGS.FIXED,
            durationSeconds: null,
            heading: "Get product updates",
            body: "One email a month about what's new in OpenStream.",
            buttonLabel: "Keep me posted",
            buttonUrl: null,
            consentText:
              "I agree to receive product emails from Acme Media. I can unsubscribe at any time.",
            dismissible: true,
          },
        ],
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
    usesSeedStorage: true,
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
      showChapters: true,
      autoplayNext: true,
    },
    embeddingHosts: ["courses.example.com", "learn.example.com"],
    videos: [
      {
        title: "Lesson 1: Getting started",
        description:
          "Create your first library, upload a video and watch it play in the embeddable player.",
        file: {
          pattern: "rgbtestsrc",
          width: 1280,
          height: 720,
          seconds: 30,
          toneHz: 392,
        },
        viewCount: 150,
        chapters: [
          { title: "Welcome", startSeconds: 0 },
          { title: "Creating a library", startSeconds: 8 },
          { title: "Your first upload", startSeconds: 18 },
          { title: "Wrap-up", startSeconds: 25 },
        ],
        ctas: [
          {
            kind: VIDEO_CTA_KINDS.EMAIL,
            placement: VIDEO_CTA_PLACEMENTS.END_SCREEN,
            startSeconds: null,
            endSeconds: null,
            timing: VIDEO_CTA_TIMINGS.FIXED,
            durationSeconds: null,
            heading: "Get the next lesson by email",
            body: null,
            buttonLabel: "Send it to me",
            buttonUrl: null,
            consentText:
              "I agree to receive course emails from Acme Media. I can unsubscribe at any time.",
            dismissible: true,
          },
        ],
      },
      {
        title: "Lesson 2: Uploading videos",
        description:
          "Upload large files that resume after a dropped connection, or import a video from a URL.",
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
    playlist: {
      title: "OpenStream basics",
      description: "Everything you need to publish your first video.",
      videoTitles: ["Lesson 1: Getting started", "Lesson 2: Uploading videos"],
    },
  },
]

export const SEED_API_KEY = {
  name: "Seed key",
  scopes: Object.values(LIBRARY_API_KEY_SCOPES),
}

export const SEED_VIEW_DAYS = 30

/** Of the seeded views that showed a call to action, the shares that answered it and that closed it. */
export const SEED_CTA_ANSWER_SHARE = 0.15
export const SEED_CTA_DISMISS_SHARE = 0.3

/** Desktop views are the most common, as in most libraries. */
export const SEED_DEVICE_TYPES = [
  VIEWER_DEVICE_TYPES.DESKTOP,
  VIEWER_DEVICE_TYPES.DESKTOP,
  VIEWER_DEVICE_TYPES.DESKTOP,
  VIEWER_DEVICE_TYPES.MOBILE,
  VIEWER_DEVICE_TYPES.MOBILE,
  VIEWER_DEVICE_TYPES.TABLET,
]
