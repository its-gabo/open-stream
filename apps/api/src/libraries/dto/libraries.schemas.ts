import {
  LIBRARY_API_KEY_SCOPES,
  LIBRARY_SECURITY_LIMITS,
  LIBRARY_STORAGE_KINDS,
  PLAYBACK_URL_TTL_SECONDS,
  VIDEO_FAILURE_REASONS,
  VIDEO_FIELD_LIMITS,
  VIDEO_FILE_FORMATS,
  VIDEO_PROCESSING_FAILURE_REASONS,
  VIDEO_POSTER_SOURCES,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_QUALITIES,
  VIDEO_STATUSES,
  libraryApiKeyNameSchema,
  libraryApiKeyScopesSchema,
  libraryNameSchema,
  libraryPlayerSettingsSchema,
  playbackHostSchema,
  videoChaptersSchema,
  videoDescriptionSchema,
  videoImportUrlSchema,
  videoQualitiesSchema,
  videoTitleSchema,
} from "@workspace/shared"
import { z } from "zod"
import { paginationDtoSchema } from "../../common/http/pagination/pagination.schemas"
import { storageDtoSchema } from "../../storage/dto/storages.schemas"
import {
  apiEmptyDataSchema,
  createApiSuccessResponseSchema,
} from "../../common/http/response/response.schemas"

export const libraryParamSchema = z.object({
  organizationSlug: z.string(),
  libraryId: z.uuid(),
})

export const videoParamSchema = libraryParamSchema.extend({
  videoId: z.uuid(),
})

export const videoUploadParamSchema = videoParamSchema.extend({
  uploadId: z.uuid(),
})

/** Library API routes name the library by its id alone; the API key proves access. */
export const publicLibraryParamSchema = z.object({ libraryId: z.uuid() })

export const publicVideoParamSchema = publicLibraryParamSchema.extend({
  videoId: z.uuid(),
})

export const publicVideoUploadParamSchema = publicVideoParamSchema.extend({
  uploadId: z.uuid(),
})

export const libraryApiKeyParamSchema = libraryParamSchema.extend({
  apiKeyId: z.uuid(),
})

export const libraryApiKeyCreateBodySchema = z
  .object({
    name: libraryApiKeyNameSchema,
    scopes: libraryApiKeyScopesSchema,
  })
  .meta({ id: "LibraryApiKeyCreateBody" })

export const libraryApiKeyUpdateBodySchema = z
  .object({
    name: libraryApiKeyNameSchema.optional(),
    scopes: libraryApiKeyScopesSchema.optional(),
  })
  .refine((body) => body.name !== undefined || body.scopes !== undefined)
  .meta({ id: "LibraryApiKeyUpdateBody" })

export const playbackQuerySchema = z.object({
  key: z.string().optional(),
  expires: z.string().optional(),
  token: z.string().optional(),
})

const videoQualitySchema = z.enum(VIDEO_QUALITIES).meta({ id: "VideoQuality" })

export const libraryEncodingUpdateBodySchema = z
  .object({ transcodeQualities: videoQualitiesSchema })
  .meta({ id: "LibraryEncodingUpdateBody" })

export const libraryEncodingSettingsDtoSchema = z
  .object({
    /** HLS renditions new uploads are transcoded to; never above the source's own size. */
    transcodeQualities: z.array(videoQualitySchema),
  })
  .meta({ id: "LibraryEncodingSettings" })

/** Every setting is sent each time, so a request names the whole look. */
export const libraryPlayerUpdateBodySchema = libraryPlayerSettingsSchema.meta({
  id: "LibraryPlayerUpdateBody",
})

export const libraryPlayerSettingsDtoSchema = libraryPlayerSettingsSchema.meta({
  id: "LibraryPlayerSettings",
})

/** A file of a ready video's HLS output, below `/hls/`. */
export const videoHlsFileParamSchema = z.object({
  libraryId: z.uuid(),
  videoId: z.uuid(),
  path: z.string().max(64),
})

/** A file of a ready video's HLS output, for members in the web app. */
export const memberVideoHlsFileParamSchema = videoParamSchema.extend({
  path: z.string().max(64),
})

export const memberVideoThumbnailParamSchema = videoParamSchema.extend({
  fileName: z.string().max(32),
})

export const videoThumbnailParamSchema = z.object({
  libraryId: z.uuid(),
  videoId: z.uuid(),
  fileName: z.string().max(32),
})

export const librarySecurityUpdateBodySchema = z
  .object({
    allowedPlaybackHosts: z
      .array(playbackHostSchema)
      .max(LIBRARY_SECURITY_LIMITS.MAX_PLAYBACK_HOSTS)
      .transform((hosts) => [...new Set(hosts)]),
    requireSignedPlayback: z.boolean(),
  })
  .meta({ id: "LibrarySecurityUpdateBody" })

export const playbackUrlCreateBodySchema = z
  .object({
    expiresInSeconds: z
      .int()
      .min(PLAYBACK_URL_TTL_SECONDS.MIN)
      .max(PLAYBACK_URL_TTL_SECONDS.MAX)
      .default(PLAYBACK_URL_TTL_SECONDS.DEFAULT),
  })
  .meta({ id: "PlaybackUrlCreateBody" })

export const libraryCreateBodySchema = z
  .object({ name: libraryNameSchema })
  .meta({ id: "LibraryCreateBody" })

export const libraryUpdateBodySchema = z
  .object({ name: libraryNameSchema })
  .meta({ id: "LibraryUpdateBody" })

/** One of the organization's storages, or null for the default storage. */
export const libraryStorageUpdateBodySchema = z
  .object({ storageId: z.uuid().nullable() })
  .meta({ id: "LibraryStorageUpdateBody" })

/** A title, or the name of the file the video is created for; the title wins when both are sent. */
export const videoCreateBodySchema = z
  .object({
    title: videoTitleSchema.optional(),
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(VIDEO_FIELD_LIMITS.FILE_NAME_MAX_LENGTH)
      .optional(),
  })
  .refine((body) => body.title !== undefined || body.fileName !== undefined)
  .meta({ id: "VideoCreateBody" })

/** A direct link to the video's MP4 or MOV file; the worker downloads it. */
export const videoImportBodySchema = z
  .object({ url: videoImportUrlSchema })
  .meta({ id: "VideoImportBody" })

/** Only the fields sent change; an empty or null description removes it. */
export const videoUpdateBodySchema = z
  .object({
    title: videoTitleSchema.optional(),
    description: videoDescriptionSchema.nullable().optional(),
  })
  .refine((body) => body.title !== undefined || body.description !== undefined)
  .meta({ id: "VideoUpdateBody" })

/** A frame of the video, in seconds from its start, or the poster picked automatically. */
export const videoPosterUpdateBodySchema = z
  .discriminatedUnion("source", [
    z.object({ source: z.literal(VIDEO_POSTER_SOURCES.AUTOMATIC) }),
    z.object({
      source: z.literal(VIDEO_POSTER_SOURCES.FRAME),
      atSeconds: z.number().nonnegative(),
    }),
  ])
  .meta({ id: "VideoPosterUpdateBody" })

/** Replaces all of the video's chapters; an empty list removes them. */
export const videoChaptersUpdateBodySchema = z
  .object({ chapters: videoChaptersSchema })
  .meta({ id: "VideoChaptersUpdateBody" })

/** A JPEG, PNG or WebP image; it is scaled down to the poster's size. */
export const videoPosterImageBodySchema = z
  .object({ image: z.file() })
  .meta({ id: "VideoPosterImageBody" })

const libraryStorageKindSchema = z
  .enum(LIBRARY_STORAGE_KINDS)
  .meta({ id: "LibraryStorageKind" })

const videoStatusSchema = z.enum(VIDEO_STATUSES).meta({ id: "VideoStatus" })

const videoFailureReasonSchema = z
  .enum(VIDEO_FAILURE_REASONS)
  .meta({ id: "VideoFailureReason" })

const videoProcessingStatusSchema = z
  .enum(VIDEO_PROCESSING_STATUSES)
  .meta({ id: "VideoProcessingStatus" })

const videoProcessingFailureReasonSchema = z
  .enum(VIDEO_PROCESSING_FAILURE_REASONS)
  .meta({ id: "VideoProcessingFailureReason" })

export const videoRenditionDtoSchema = z
  .object({
    quality: videoQualitySchema,
    width: z.int().positive(),
    height: z.int().positive(),
    bandwidth: z.int().nonnegative(),
  })
  .meta({ id: "VideoRendition" })

const videoPosterSourceSchema = z
  .enum(VIDEO_POSTER_SOURCES)
  .meta({ id: "VideoPosterSource" })

export const videoPosterDtoSchema = z
  .object({
    source: videoPosterSourceSchema,
    /** The chosen frame, in seconds from the start; null unless the source is `frame`. */
    frameSeconds: z.number().nonnegative().nullable(),
    /** When the poster last changed; null until the video is processed. */
    updatedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "VideoPoster" })

export const videoChapterDtoSchema = z
  .object({
    title: z.string(),
    /** Seconds from the start; the chapter runs until the next one starts, or the video ends. */
    startSeconds: z.number().nonnegative(),
  })
  .meta({ id: "VideoChapter" })

const videoFileFormatSchema = z
  .enum(VIDEO_FILE_FORMATS)
  .meta({ id: "VideoFileFormat" })

export const libraryDtoSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    storageKind: libraryStorageKindSchema,
    /** Name of the assigned storage; null on the default storage. */
    storageName: z.string().nullable(),
    videoCount: z.int().nonnegative(),
    /** True once a video file was stored; the library's storage can no longer change. */
    isStorageLocked: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Library" })

export const libraryStorageSettingsDtoSchema = z
  .object({
    kind: libraryStorageKindSchema,
    /** Folder layout of videos in the default storage. */
    defaultPathTemplate: z.string(),
    /** The assigned storage; null on the default storage. */
    custom: storageDtoSchema.nullable(),
    /** True once a video file of this library was stored; its storage can no longer change. */
    isLocked: z.boolean(),
  })
  .meta({ id: "LibraryStorageSettings" })

export const videoDtoSchema = z
  .object({
    id: z.uuid(),
    libraryId: z.uuid(),
    title: z.string(),
    /** Null when the video has none. */
    description: z.string().nullable(),
    status: videoStatusSchema,
    failureReason: videoFailureReasonSchema.nullable(),
    fileName: z.string().nullable(),
    fileFormat: videoFileFormatSchema.nullable(),
    /** Null while an import's size is unknown, until its server sends it or the download ends. */
    sizeBytes: z.int().nonnegative().nullable(),
    uploadedBytes: z.int().nonnegative(),
    /** Host of the URL the file is being imported from; null otherwise. */
    importHost: z.string().nullable(),
    createdAt: z.iso.datetime(),
    uploadedAt: z.iso.datetime().nullable(),
    /** HLS transcoding, once the file is uploaded; null before that. */
    processingStatus: videoProcessingStatusSchema.nullable(),
    processingFailureReason: videoProcessingFailureReasonSchema.nullable(),
    durationSeconds: z.number().nonnegative().nullable(),
    width: z.int().positive().nullable(),
    height: z.int().positive().nullable(),
    renditions: z.array(videoRenditionDtoSchema),
    processedAt: z.iso.datetime().nullable(),
    poster: videoPosterDtoSchema,
    /** In playback order; the first starts at 0:00. Empty when the video has none. */
    chapters: z.array(videoChapterDtoSchema),
  })
  .meta({ id: "Video" })

/** Where a video is in its life: uploading, then processing; also the `data` of `video.*` webhook events. */
export const videoStatusDetailsDtoSchema = z
  .object({
    videoId: z.uuid(),
    libraryId: z.uuid(),
    title: z.string(),
    uploadStatus: videoStatusSchema,
    uploadFailureReason: videoFailureReasonSchema.nullable(),
    /** Null until the file is uploaded. */
    processingStatus: videoProcessingStatusSchema.nullable(),
    processingFailureReason: videoProcessingFailureReasonSchema.nullable(),
    durationSeconds: z.number().nonnegative().nullable(),
    width: z.int().positive().nullable(),
    height: z.int().positive().nullable(),
    /** The HLS renditions, once processing is ready. */
    renditions: z.array(videoRenditionDtoSchema),
    processedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "VideoStatusDetails" })

export const librarySecuritySettingsDtoSchema = z
  .object({
    /** Hosts whose pages may play the videos; any host when empty. */
    allowedPlaybackHosts: z.array(z.string()),
    requireSignedPlayback: z.boolean(),
  })
  .meta({ id: "LibrarySecuritySettings" })

const libraryApiKeyScopeSchema = z
  .enum(LIBRARY_API_KEY_SCOPES)
  .meta({ id: "LibraryApiKeyScope" })

/** The secret itself is shown only when it is created or rolled. */
export const libraryApiKeyDtoSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    hint: z.string(),
    scopes: z.array(libraryApiKeyScopeSchema),
    createdAt: z.iso.datetime(),
    lastUsedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "LibraryApiKey" })

export const libraryApiAccessDtoSchema = z
  .object({
    /** Identifies the library in the library API. */
    libraryId: z.uuid(),
    /** Base URL of the library API. */
    apiUrl: z.url(),
    apiKeys: z.array(libraryApiKeyDtoSchema),
    security: librarySecuritySettingsDtoSchema,
  })
  .meta({ id: "LibraryApiAccess" })

export const playbackUrlDtoSchema = z
  .object({
    /** HLS master playlist; plays once the video is processed. */
    hlsUrl: z.url(),
    /** The uploaded file as it is, with range requests. */
    originalUrl: z.url(),
    posterUrl: z.url(),
    /** WebVTT of seek preview tiles. */
    storyboardUrl: z.url(),
    /** WebVTT chapters track, for players of your own; empty while the video has no chapters. */
    chaptersUrl: z.url(),
    /** The video's caption tracks with a WebVTT URL each, for players of your own. */
    captionsUrl: z.url(),
    /** The embeddable player page, for an iframe; signed like the other URLs. */
    embedUrl: z.url(),
    expiresAt: z.iso.datetime(),
  })
  .meta({ id: "PlaybackUrl" })

export const videoEmbedDtoSchema = z
  .object({
    videoId: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    durationSeconds: z.number().nonnegative(),
    width: z.int().positive(),
    height: z.int().positive(),
    /** HLS master playlist, carrying the embed URL's signature when it had one. */
    hlsUrl: z.url(),
    posterUrl: z.url(),
    /** WebVTT of seek preview tiles. */
    storyboardUrl: z.url(),
    /** Where the player starts counting a view, carrying the same signature. */
    viewsUrl: z.url(),
    /** Where the player reads the video's calls to action, carrying the same signature. */
    ctasUrl: z.url(),
    /** Where the player reads the video's caption tracks, carrying the same signature. */
    captionsUrl: z.url(),
    chapters: z.array(videoChapterDtoSchema),
    /** Hosts allowed to frame the player; empty when any site may. */
    allowedPlaybackHosts: z.array(z.string()),
    /** How the library's player looks and which controls it offers. */
    player: libraryPlayerSettingsDtoSchema,
  })
  .meta({ id: "VideoEmbed" })

export const libraryEmptySuccessResponseSchema = createApiSuccessResponseSchema(
  apiEmptyDataSchema
).meta({ id: "LibraryEmptySuccessResponse" })

export const libraryListSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({
    libraries: z.array(libraryDtoSchema),
    pagination: paginationDtoSchema,
  })
).meta({ id: "LibraryListSuccessResponse" })

export const librarySuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ library: libraryDtoSchema })
).meta({ id: "LibrarySuccessResponse" })

export const libraryStorageSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ storage: libraryStorageSettingsDtoSchema })
  ).meta({ id: "LibraryStorageSuccessResponse" })

export const libraryEncodingSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ encoding: libraryEncodingSettingsDtoSchema })
  ).meta({ id: "LibraryEncodingSuccessResponse" })

export const libraryPlayerSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ player: libraryPlayerSettingsDtoSchema })
  ).meta({ id: "LibraryPlayerSuccessResponse" })

export const libraryApiAccessSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ apiAccess: libraryApiAccessDtoSchema })
  ).meta({ id: "LibraryApiAccessSuccessResponse" })

export const libraryApiKeySuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ apiKey: libraryApiKeyDtoSchema })
  ).meta({ id: "LibraryApiKeySuccessResponse" })

export const libraryApiKeySecretSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      apiKey: libraryApiKeyDtoSchema,
      /** Shown only in this response; store it now. */
      secret: z.string(),
    })
  ).meta({ id: "LibraryApiKeySecretSuccessResponse" })

export const videoEmbedSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ embed: videoEmbedDtoSchema })
).meta({ id: "VideoEmbedSuccessResponse" })

export const playbackUrlSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ playback: playbackUrlDtoSchema })
).meta({ id: "PlaybackUrlSuccessResponse" })

export const videoPageSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({
    videos: z.array(videoDtoSchema),
    pagination: paginationDtoSchema,
  })
).meta({ id: "VideoPageSuccessResponse" })

export const videoStatusSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ status: videoStatusDetailsDtoSchema })
).meta({ id: "VideoStatusSuccessResponse" })

export const videoListSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ videos: z.array(videoDtoSchema) })
).meta({ id: "VideoListSuccessResponse" })

export const videoSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ video: videoDtoSchema })
).meta({ id: "VideoSuccessResponse" })

export type LibraryCreateBody = z.infer<typeof libraryCreateBodySchema>
export type LibraryUpdateBody = z.infer<typeof libraryUpdateBodySchema>
export type LibraryStorageUpdateBody = z.infer<
  typeof libraryStorageUpdateBodySchema
>
export type VideoCreateBody = z.infer<typeof videoCreateBodySchema>
export type VideoUpdateBody = z.infer<typeof videoUpdateBodySchema>
export type VideoImportBody = z.infer<typeof videoImportBodySchema>
export type VideoPosterUpdateBody = z.infer<typeof videoPosterUpdateBodySchema>
export type VideoChaptersUpdateBody = z.infer<
  typeof videoChaptersUpdateBodySchema
>
export type LibraryEncodingUpdateBody = z.infer<
  typeof libraryEncodingUpdateBodySchema
>
export type LibraryPlayerUpdateBody = z.infer<
  typeof libraryPlayerUpdateBodySchema
>
export type LibraryPlayerSettingsDto = z.infer<
  typeof libraryPlayerSettingsDtoSchema
>
export type LibrarySecurityUpdateBody = z.infer<
  typeof librarySecurityUpdateBodySchema
>
export type VideoEmbedDto = z.infer<typeof videoEmbedDtoSchema>
export type PlaybackUrlCreateBody = z.infer<typeof playbackUrlCreateBodySchema>
export type LibraryApiAccessDto = z.infer<typeof libraryApiAccessDtoSchema>
export type LibraryApiKeyDto = z.infer<typeof libraryApiKeyDtoSchema>
export type LibraryApiKeyCreateBody = z.infer<
  typeof libraryApiKeyCreateBodySchema
>
export type LibraryApiKeyUpdateBody = z.infer<
  typeof libraryApiKeyUpdateBodySchema
>
export type LibraryDto = z.infer<typeof libraryDtoSchema>
export type LibraryStorageSettingsDto = z.infer<
  typeof libraryStorageSettingsDtoSchema
>
export type VideoDto = z.infer<typeof videoDtoSchema>
export type VideoStatusDetailsDto = z.infer<typeof videoStatusDetailsDtoSchema>

/** The `key` of a signed playback URL. */
export const apiKeyIdSchema = z.uuid()
