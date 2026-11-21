import {
  TRANSCRIPTION_PROVIDER_KINDS,
  VIDEO_CAPTION_KINDS,
  VIDEO_CAPTION_SOURCES,
  VIDEO_TRANSCRIPTION_FAILURE_REASONS,
  VIDEO_TRANSCRIPTION_STATUSES,
  libraryTranscriptionSettingsInputSchema,
  transcriptionProviderCreateInputSchema,
  transcriptionProviderUpdateInputSchema,
  videoCaptionUpdateInputSchema,
  videoCaptionUploadInputSchema,
  videoTranscriptionRequestInputSchema,
} from "@workspace/shared"
import { z } from "zod"
import { createApiSuccessResponseSchema } from "../../common/http/response/response.schemas"
import { organizationParamSchema } from "../../organizations/dto/organizations.schemas"
import {
  publicVideoParamSchema,
  videoParamSchema,
} from "../../libraries/dto/libraries.schemas"

const videoCaptionKindSchema = z
  .enum(VIDEO_CAPTION_KINDS)
  .meta({ id: "VideoCaptionKind" })

const videoCaptionSourceSchema = z
  .enum(VIDEO_CAPTION_SOURCES)
  .meta({ id: "VideoCaptionSource" })

const videoTranscriptionStatusSchema = z
  .enum(VIDEO_TRANSCRIPTION_STATUSES)
  .meta({ id: "VideoTranscriptionStatus" })

const videoTranscriptionFailureReasonSchema = z
  .enum(VIDEO_TRANSCRIPTION_FAILURE_REASONS)
  .meta({ id: "VideoTranscriptionFailureReason" })

const transcriptionProviderKindSchema = z
  .enum(TRANSCRIPTION_PROVIDER_KINDS)
  .meta({ id: "TranscriptionProviderKind" })

export const videoCaptionParamSchema = videoParamSchema.extend({
  captionId: z.uuid(),
})

export const publicVideoCaptionParamSchema = publicVideoParamSchema.extend({
  captionId: z.uuid(),
})

/** A track's WebVTT as players read it: `<captionId>.vtt`. */
export const publicVideoCaptionFileParamSchema = publicVideoParamSchema.extend({
  fileName: z.string().regex(/^[0-9a-f-]{36}\.vtt$/),
})

export const transcriptionProviderParamSchema = organizationParamSchema.extend({
  providerId: z.uuid(),
})

/** A WebVTT or SRT file with what it is; a track of the same language and kind is replaced. */
export const videoCaptionUploadBodySchema = videoCaptionUploadInputSchema
  .extend({ file: z.file() })
  .meta({ id: "VideoCaptionUploadBody" })

export const videoCaptionUpdateBodySchema = videoCaptionUpdateInputSchema.meta({
  id: "VideoCaptionUpdateBody",
})

export const videoTranscriptionRequestBodySchema =
  videoTranscriptionRequestInputSchema.meta({
    id: "VideoTranscriptionRequestBody",
  })

export const transcriptionProviderCreateBodySchema =
  transcriptionProviderCreateInputSchema.meta({
    id: "TranscriptionProviderCreateBody",
  })

export const transcriptionProviderUpdateBodySchema =
  transcriptionProviderUpdateInputSchema.meta({
    id: "TranscriptionProviderUpdateBody",
  })

export const libraryTranscriptionUpdateBodySchema =
  libraryTranscriptionSettingsInputSchema.meta({
    id: "LibraryTranscriptionUpdateBody",
  })

export const videoCaptionDtoSchema = z
  .object({
    id: z.uuid(),
    videoId: z.uuid(),
    /** BCP 47, e.g. `en` or `pt-BR`. */
    language: z.string(),
    label: z.string(),
    kind: videoCaptionKindSchema,
    /** Players turn it on by themselves. */
    isDefault: z.boolean(),
    source: videoCaptionSourceSchema,
    /** The transcription that wrote it; null for an uploaded track. */
    transcriptionId: z.uuid().nullable(),
    cueCount: z.number().int().positive(),
    sizeBytes: z.number().int().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "VideoCaption" })

/** What a player needs of a track. */
export const videoEmbedCaptionDtoSchema = videoCaptionDtoSchema
  .pick({ id: true, language: true, label: true, kind: true, isDefault: true })
  .extend({
    /** The WebVTT, carrying the embed's signature when the library signs playback. */
    url: z.url(),
  })
  .meta({ id: "VideoEmbedCaption" })

export const videoTranscriptionDtoSchema = z
  .object({
    id: z.uuid(),
    videoId: z.uuid(),
    /** Null once the provider is deleted. */
    providerId: z.uuid().nullable(),
    providerName: z.string().nullable(),
    model: z.string(),
    /** The language asked for; null when the provider detects it. */
    language: z.string().nullable(),
    detectedLanguage: z.string().nullable(),
    kind: videoCaptionKindSchema,
    status: videoTranscriptionStatusSchema,
    failureReason: videoTranscriptionFailureReasonSchema.nullable(),
    createdAt: z.iso.datetime(),
    finishedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "VideoTranscription" })

export const transcriptionProviderDtoSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    kind: transcriptionProviderKindSchema,
    /** Where requests go; OpenAI's own address for OpenAI. */
    baseUrl: z.url(),
    model: z.string(),
    /** Last characters of the API key; null when it has none. */
    apiKeyHint: z.string().nullable(),
    /** Minutes of audio it may transcribe each calendar month (UTC); null for no limit. */
    monthlyMinuteLimit: z.int().positive().nullable(),
    /** Minutes of audio counted this calendar month (UTC), to a tenth; failed transcriptions do not count. */
    usedMinutesThisMonth: z.number().nonnegative(),
    /** Libraries transcribing with it; it can be deleted only once none do. */
    libraryCount: z.int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "TranscriptionProvider" })

export const libraryTranscriptionSettingsDtoSchema = z
  .object({
    providerId: z.uuid().nullable(),
    autoTranscribe: z.boolean(),
    language: z.string().nullable(),
  })
  .meta({ id: "LibraryTranscriptionSettings" })

export const transcriptionConnectionTestDtoSchema = z
  .object({
    isReachable: z.boolean(),
    isAuthorized: z.boolean(),
  })
  .meta({ id: "TranscriptionConnectionTest" })

export const videoCaptionListSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      captions: z.array(videoCaptionDtoSchema),
      /** The newest transcriptions, first the one running if any. */
      transcriptions: z.array(videoTranscriptionDtoSchema),
    })
  ).meta({ id: "VideoCaptionListSuccessResponse" })

export const videoCaptionSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ caption: videoCaptionDtoSchema })
).meta({ id: "VideoCaptionSuccessResponse" })

export const videoTranscriptionSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ transcription: videoTranscriptionDtoSchema })
  ).meta({ id: "VideoTranscriptionSuccessResponse" })

export const videoEmbedCaptionListSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ captions: z.array(videoEmbedCaptionDtoSchema) })
  ).meta({ id: "VideoEmbedCaptionListSuccessResponse" })

export const transcriptionProviderListSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ providers: z.array(transcriptionProviderDtoSchema) })
  ).meta({ id: "TranscriptionProviderListSuccessResponse" })

export const transcriptionProviderSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ provider: transcriptionProviderDtoSchema })
  ).meta({ id: "TranscriptionProviderSuccessResponse" })

export const transcriptionConnectionTestSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ connection: transcriptionConnectionTestDtoSchema })
  ).meta({ id: "TranscriptionConnectionTestSuccessResponse" })

export const libraryTranscriptionSettingsSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ transcription: libraryTranscriptionSettingsDtoSchema })
  ).meta({ id: "LibraryTranscriptionSettingsSuccessResponse" })

export type VideoCaptionUploadBody = z.infer<
  typeof videoCaptionUploadBodySchema
>
export type VideoCaptionUpdateBody = z.infer<
  typeof videoCaptionUpdateBodySchema
>
export type VideoTranscriptionRequestBody = z.infer<
  typeof videoTranscriptionRequestBodySchema
>
export type TranscriptionProviderCreateBody = z.infer<
  typeof transcriptionProviderCreateBodySchema
>
export type TranscriptionProviderUpdateBody = z.infer<
  typeof transcriptionProviderUpdateBodySchema
>
export type LibraryTranscriptionUpdateBody = z.infer<
  typeof libraryTranscriptionUpdateBodySchema
>
export type VideoCaptionDto = z.infer<typeof videoCaptionDtoSchema>
export type VideoEmbedCaptionDto = z.infer<typeof videoEmbedCaptionDtoSchema>
export type VideoTranscriptionDto = z.infer<typeof videoTranscriptionDtoSchema>
export type TranscriptionProviderDto = z.infer<
  typeof transcriptionProviderDtoSchema
>
