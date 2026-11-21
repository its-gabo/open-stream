import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { eq } from "drizzle-orm"
import type { ActivityRequestSource } from "../../activity/types/activity.types"
import { activityActorOfUser } from "../../activity/utils/activity-actor.utils"
import { createAppModule, type AppModule } from "../../app.module"
import type { AuthUserSession } from "../../auth/types/auth.types"
import { readConfig } from "../../config/app.config"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import type { OrganizationAccess } from "../../organizations/types/organizations.types"
import { VIDEO_CTA_KINDS, VIDEO_CTA_PLACEMENTS } from "@workspace/shared"
import {
  users,
  videoCtaLeads,
  videoCtas,
  videoViewCtas,
  videoViews,
  videos,
  type NewVideoCtaLeadRecord,
  type NewVideoViewRecord,
  type VideoCtaRecord,
  type VideoViewRecord,
} from "../schema"
import { ensureSeedBucket } from "./seed-bucket"
import {
  SEED_API_KEY,
  SEED_CTA_ANSWER_SHARE,
  SEED_CTA_DISMISS_SHARE,
  SEED_DEVICE_TYPES,
  SEED_LIBRARIES,
  SEED_ORGANIZATION,
  SEED_PASSWORD,
  SEED_STORAGE,
  SEED_USERS,
  SEED_VIEW_DAYS,
  type SeedLibrary,
  type SeedVideo,
  type SeedVideoFile,
} from "./seed.constants"

const SEED_REQUEST_SOURCE: ActivityRequestSource = {
  ipAddress: null,
  userAgent: null,
}
const DAY_MS = 24 * 60 * 60 * 1000

/** The same pseudo-random numbers on every run, so seeded analytics look alike each time. */
function createRandom(seed: number) {
  let state = seed

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(42)
const pick = <T>(items: readonly T[]) =>
  items[Math.floor(random() * items.length)]!

/** An MP4 of an ffmpeg test pattern and a tone, small enough to make in a second or two. */
export async function createSeedVideoFile(
  ffmpegPath: string,
  { pattern, width, height, seconds, toneHz }: SeedVideoFile
) {
  const dir = await mkdtemp(join(tmpdir(), "openstream-seed-"))
  const outputPath = join(dir, "seed.mp4")
  const videoArgs = pattern
    ? [
        "-f",
        "lavfi",
        "-i",
        `${pattern}=size=${width}x${height}:rate=24:duration=${seconds}`,
      ]
    : []
  const child = Bun.spawn(
    [
      ffmpegPath,
      "-hide_banner",
      "-loglevel",
      "error",
      ...videoArgs,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${toneHz}:duration=${seconds}`,
      ...(pattern
        ? ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p"]
        : []),
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-shortest",
      outputPath,
    ],
    { stderr: "pipe" }
  )

  try {
    if ((await child.exited) !== 0) {
      throw new Error(
        `ffmpeg could not make a seed video: ${await new Response(child.stderr).text()}`
      )
    }

    return await Bun.file(outputPath).bytes()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Registers a verified account; seeding skips the verification email's link. */
async function createSeedUser(
  appModule: AppModule,
  user: { name: string; email: string }
): Promise<AuthUserSession> {
  await appModule.authRegistrationService.signUpWithEmail(
    { ...user, password: SEED_PASSWORD },
    SEED_REQUEST_SOURCE
  )

  const [created] = await appModule.db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, user.email))
    .returning()

  return {
    userId: created!.id,
    email: created!.email,
    name: created!.name,
    emailVerified: true,
    expiresAt: new Date(Date.now() + DAY_MS),
  }
}

async function createSeedOrganization(
  appModule: AppModule,
  owner: AuthUserSession,
  member: AuthUserSession
) {
  const ownerActor = activityActorOfUser(owner, SEED_REQUEST_SOURCE)

  await appModule.organizationsService.createOrganization(
    owner,
    ownerActor,
    SEED_ORGANIZATION
  )

  const access = await appModule.organizationsService.findAccess(
    owner.userId,
    SEED_ORGANIZATION.slug
  )
  const { invitation } = await appModule.organizationTeamService.inviteMember(
    access!,
    owner,
    ownerActor,
    { email: member.email }
  )

  await appModule.organizationInvitationsService.acceptInvitation(
    member,
    activityActorOfUser(member, SEED_REQUEST_SOURCE),
    invitation.invitationId
  )

  return access!
}

/** Creates the seed storage's bucket, then the storage pointing at it, on the same server as the default storage. */
async function createSeedStorage(
  appModule: AppModule,
  access: OrganizationAccess,
  owner: AuthUserSession
) {
  const { config } = appModule

  await ensureSeedBucket(config, SEED_STORAGE.bucket)

  const { storage } = await appModule.storagesService.createStorage(
    access,
    activityActorOfUser(owner, SEED_REQUEST_SOURCE),
    {
      name: SEED_STORAGE.name,
      endpoint: config.OBJECT_STORAGE_ENDPOINT,
      region: config.OBJECT_STORAGE_REGION,
      bucket: SEED_STORAGE.bucket,
      forcePathStyle: config.OBJECT_STORAGE_FORCE_PATH_STYLE,
      pathTemplate: SEED_STORAGE.pathTemplate,
      accessKeyId: config.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: config.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    }
  )

  return storage.id
}

async function createSeedLibrary(
  appModule: AppModule,
  access: OrganizationAccess,
  owner: AuthUserSession,
  seedLibrary: SeedLibrary,
  seedStorageId: string
) {
  const actor = activityActorOfUser(owner, SEED_REQUEST_SOURCE)
  const { library: created } = await appModule.librariesService.createLibrary(
    access,
    actor,
    { name: seedLibrary.name }
  )
  if (seedLibrary.usesSeedStorage) {
    // Before any upload: a library's storage is locked once it holds a file.
    await appModule.libraryStorageService.assignStorage(
      (await appModule.librariesService.findLibrary(
        access.organization.id,
        created.id
      ))!,
      actor,
      { storageId: seedStorageId }
    )
  }

  const library = (await appModule.librariesService.findLibrary(
    access.organization.id,
    created.id
  ))!

  if (seedLibrary.security) {
    await appModule.libraryApiAccessService.updateSecurity(
      library,
      actor,
      seedLibrary.security
    )
  }

  if (seedLibrary.player) {
    await appModule.librariesService.updatePlayerSettings(
      library,
      actor,
      seedLibrary.player
    )
  }

  return library
}

/** Creates the video and, when it has a file, uploads it in one chunk, which queues it for processing. */
async function createSeedVideo(
  appModule: AppModule,
  library: LibraryProfile,
  owner: AuthUserSession,
  seedVideo: SeedVideo
) {
  const actor = activityActorOfUser(owner, SEED_REQUEST_SOURCE)
  const { video } = await appModule.videosService.createVideo(library, actor, {
    title: seedVideo.title,
  })

  if (seedVideo.description) {
    await appModule.videosService.updateVideoDetails(library, actor, video.id, {
      description: seedVideo.description,
    })
  }

  if (!seedVideo.file) return { video, ctas: [] }

  const ctas = seedVideo.ctas?.length
    ? await appModule.db
        .insert(videoCtas)
        .values(
          seedVideo.ctas.map((cta) => ({
            ...cta,
            organizationId: library.organizationId,
            libraryId: library.id,
            videoId: video.id,
            createdById: owner.userId,
          }))
        )
        .returning()
    : []

  if (seedVideo.chapters) {
    await appModule.db
      .update(videos)
      .set({ chapters: seedVideo.chapters })
      .where(eq(videos.id, video.id))
  }

  const bytes = await createSeedVideoFile(
    appModule.config.FFMPEG_PATH,
    seedVideo.file
  )
  const { uploadId } = await appModule.videoUploadsService.startUpload(
    library,
    video.id,
    { fileName: `${seedVideo.title}.mp4`, uploadLength: bytes.byteLength }
  )

  await appModule.videoUploadsService.appendChunk(
    library,
    actor,
    video.id,
    uploadId,
    { uploadOffset: 0, bytes }
  )

  return { video, ctas }
}

/** Views as the player would have recorded them, from the last `SEED_VIEW_DAYS` days. */
function buildSeedViews(
  library: LibraryProfile,
  videoId: string,
  seedLibrary: SeedLibrary,
  seedVideo: SeedVideo
): NewVideoViewRecord[] {
  if (!seedVideo.file?.pattern) return []

  const { seconds } = seedVideo.file
  const now = Date.now()

  return Array.from({ length: seedVideo.viewCount }, () => {
    const startedAt = new Date(now - random() * SEED_VIEW_DAYS * DAY_MS)
    // Most viewers drop off early; about a third watch to the end.
    const furthestPositionSeconds =
      random() < 0.35 ? seconds : seconds * random() ** 1.5
    const watchedSeconds = furthestPositionSeconds * (0.8 + random() * 0.2)

    return {
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
      deviceType: pick(SEED_DEVICE_TYPES),
      embeddingHost: pick(seedLibrary.embeddingHosts),
      watchedSeconds,
      furthestPositionSeconds,
      startedAt,
      lastReportedAt: new Date(startedAt.getTime() + watchedSeconds * 1000),
    }
  })
}

/**
 * What the seeded views did with the video's calls to action: each view
 * that got to one showed it, and some of those answered or closed it.
 * Views that left an email address leave a lead.
 */
function buildSeedCtaActivity(
  views: VideoViewRecord[],
  ctas: VideoCtaRecord[],
  seedVideo: SeedVideo
) {
  const durationSeconds = seedVideo.file?.seconds ?? 0
  const viewCtas: (typeof videoViewCtas.$inferInsert)[] = []
  const leads: NewVideoCtaLeadRecord[] = []

  for (const cta of ctas) {
    const showsAtSeconds =
      cta.placement === VIDEO_CTA_PLACEMENTS.END_SCREEN
        ? durationSeconds
        : (cta.startSeconds ?? 0)

    for (const view of views) {
      if (view.furthestPositionSeconds < showsAtSeconds) continue

      const shownAt = new Date(view.startedAt.getTime() + showsAtSeconds * 1000)
      const answeredAt = new Date(shownAt.getTime() + 4000)
      const chance = random()
      const isAnswered = chance < SEED_CTA_ANSWER_SHARE
      const isEmail = cta.kind === VIDEO_CTA_KINDS.EMAIL

      viewCtas.push({
        viewId: view.id,
        ctaId: cta.id,
        videoId: view.videoId,
        organizationId: view.organizationId,
        libraryId: view.libraryId,
        shownAt,
        clickedAt: isAnswered && !isEmail ? answeredAt : null,
        submittedAt: isAnswered && isEmail ? answeredAt : null,
        dismissedAt:
          !isAnswered && chance < SEED_CTA_ANSWER_SHARE + SEED_CTA_DISMISS_SHARE
            ? answeredAt
            : null,
      })

      if (isAnswered && isEmail && cta.consentText) {
        leads.push({
          organizationId: view.organizationId,
          libraryId: view.libraryId,
          videoId: view.videoId,
          ctaId: cta.id,
          viewId: view.id,
          email: `viewer${leads.length + 1}.${cta.id.slice(0, 4)}@example.com`,
          consentText: cta.consentText,
          consentedAt: answeredAt,
          ctaHeading: cta.heading,
          videoTitle: seedVideo.title,
          embeddingHost: view.embeddingHost,
          createdAt: answeredAt,
        })
      }
    }
  }

  return { viewCtas, leads }
}

async function seed(appModule: AppModule) {
  const [existing] = await appModule.db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SEED_USERS.OWNER.email))

  if (existing) {
    console.log(
      `Already seeded: ${SEED_USERS.OWNER.email} exists. Reset the database to seed again.`
    )

    return
  }

  const owner = await createSeedUser(appModule, SEED_USERS.OWNER)
  const member = await createSeedUser(appModule, SEED_USERS.MEMBER)
  const access = await createSeedOrganization(appModule, owner, member)
  const seedStorageId = await createSeedStorage(appModule, access, owner)
  let apiKeySecret: string | null = null

  for (const seedLibrary of SEED_LIBRARIES) {
    const library = await createSeedLibrary(
      appModule,
      access,
      owner,
      seedLibrary,
      seedStorageId
    )

    apiKeySecret ??= (
      await appModule.libraryApiAccessService.createApiKey(
        library,
        activityActorOfUser(owner, SEED_REQUEST_SOURCE),
        SEED_API_KEY
      )
    ).secret

    const videoIdsByTitle = new Map<string, string>()

    for (const seedVideo of seedLibrary.videos) {
      const { video, ctas } = await createSeedVideo(
        appModule,
        library,
        owner,
        seedVideo
      )
      const views = buildSeedViews(library, video.id, seedLibrary, seedVideo)
      const insertedViews =
        views.length > 0
          ? await appModule.db.insert(videoViews).values(views).returning()
          : []
      const { viewCtas, leads } = buildSeedCtaActivity(
        insertedViews,
        ctas,
        seedVideo
      )

      if (viewCtas.length > 0) {
        await appModule.db.insert(videoViewCtas).values(viewCtas)
      }

      if (leads.length > 0) {
        await appModule.db.insert(videoCtaLeads).values(leads)
      }

      videoIdsByTitle.set(seedVideo.title, video.id)
      console.log(`  ${seedLibrary.name} / ${seedVideo.title}`)
    }

    if (seedLibrary.playlist) {
      const { title, description, videoTitles } = seedLibrary.playlist

      await appModule.playlistsService.createPlaylist(
        library,
        activityActorOfUser(owner, SEED_REQUEST_SOURCE),
        {
          title,
          description,
          videoIds: videoTitles.map((videoTitle) =>
            videoIdsByTitle.get(videoTitle)!
          ),
        }
      )
      console.log(`  ${seedLibrary.name} / playlist "${title}"`)
    }
  }

  console.log(`
Seeded ${SEED_ORGANIZATION.name}. Sign in with password "${SEED_PASSWORD}" as:
  ${SEED_USERS.OWNER.email} (owner)
  ${SEED_USERS.MEMBER.email} (member)

API key of "${SEED_LIBRARIES[0]!.name}", shown only now: ${apiKeySecret}

The worker transcodes the uploaded videos; start it with \`bun run dev\`.`)
}

const appModule = createAppModule(readConfig())

try {
  await seed(appModule)
} finally {
  await appModule.close()
}
