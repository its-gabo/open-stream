import {
  VIDEO_CTA_EVENT_TYPES,
  VIDEO_CTA_KINDS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
  videoCtaInputSchema,
  videoCtaLeadInputSchema,
} from "@workspace/shared"
import { z } from "zod"
import {
  paginationDtoSchema,
  paginationQuerySchema,
} from "../../common/http/pagination/pagination.schemas"
import { createApiSuccessResponseSchema } from "../../common/http/response/response.schemas"
import {
  libraryParamSchema,
  publicVideoParamSchema,
  videoParamSchema,
} from "../../libraries/dto/libraries.schemas"

const videoCtaKindSchema = z.enum(VIDEO_CTA_KINDS).meta({ id: "VideoCtaKind" })

const videoCtaTimingSchema = z
  .enum(VIDEO_CTA_TIMINGS)
  .meta({ id: "VideoCtaTiming" })

const videoCtaPlacementSchema = z
  .enum(VIDEO_CTA_PLACEMENTS)
  .meta({ id: "VideoCtaPlacement" })

export const videoCtaParamSchema = videoParamSchema.extend({ ctaId: z.uuid() })

export const publicVideoCtaParamSchema = publicVideoParamSchema.extend({
  ctaId: z.uuid(),
})

/** A call to action reported about during a view. */
export const videoViewCtaParamSchema = publicVideoParamSchema.extend({
  viewId: z.uuid(),
  ctaId: z.uuid(),
})

export const videoCtaLeadParamSchema = libraryParamSchema.extend({
  leadId: z.uuid(),
})

/** Creates a call to action, or replaces all of one's fields. */
export const videoCtaBodySchema = videoCtaInputSchema.meta({
  id: "VideoCtaBody",
})

export const videoCtaEventBodySchema = z
  .object({ type: z.enum(VIDEO_CTA_EVENT_TYPES) })
  .meta({ id: "VideoCtaEventBody" })

export const videoCtaLeadBodySchema = videoCtaLeadInputSchema.meta({
  id: "VideoCtaLeadBody",
})

/** Leads newest first, optionally of one video; `search` matches the email address. */
export const videoCtaLeadListQuerySchema = paginationQuerySchema.extend({
  videoId: z.uuid().optional(),
})

export const videoCtaLeadExportQuerySchema = z.object({
  videoId: z.uuid().optional(),
})

export const videoCtaDtoSchema = z
  .object({
    id: z.uuid(),
    videoId: z.uuid(),
    kind: videoCtaKindSchema,
    placement: videoCtaPlacementSchema,
    /** Null for an end screen. */
    startSeconds: z.number().nonnegative().nullable(),
    /** Null when an overlay stays until the video ends, and for an end screen. */
    endSeconds: z.number().nonnegative().nullable(),
    /** `random` shows the overlay for `durationSeconds` at a moment the player picks between its start and end. */
    timing: videoCtaTimingSchema,
    /** Set for a random overlay only. */
    durationSeconds: z.number().positive().nullable(),
    heading: z.string(),
    body: z.string().nullable(),
    buttonLabel: z.string(),
    /** Set for a button only. */
    buttonUrl: z.url().nullable(),
    /** Set for an email form only. */
    consentText: z.string().nullable(),
    dismissible: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "VideoCta" })

/** What a player shows of a call to action. */
export const videoEmbedCtaDtoSchema = videoCtaDtoSchema
  .omit({ videoId: true, createdAt: true, updatedAt: true })
  .meta({ id: "VideoEmbedCta" })

export const videoCtaLeadDtoSchema = z
  .object({
    id: z.uuid(),
    libraryId: z.uuid(),
    /** Null once the video is deleted. */
    videoId: z.uuid().nullable(),
    /** Null once the call to action is deleted. */
    ctaId: z.uuid().nullable(),
    email: z.string(),
    /** The consent text exactly as the viewer agreed to it. */
    consentText: z.string(),
    consentedAt: z.iso.datetime(),
    /** The call to action's heading and the video's title when the lead was left. */
    ctaHeading: z.string(),
    videoTitle: z.string(),
    /** The site the player was embedded on, when the player knew it. */
    embeddingHost: z.string().nullable(),
  })
  .meta({ id: "VideoCtaLead" })

export const videoCtaListSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ ctas: z.array(videoCtaDtoSchema) })
).meta({ id: "VideoCtaListSuccessResponse" })

export const videoCtaSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ cta: videoCtaDtoSchema })
).meta({ id: "VideoCtaSuccessResponse" })

export const videoEmbedCtaListSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      /** Overlays by start, then the end screen. */
      ctas: z.array(videoEmbedCtaDtoSchema),
    })
  ).meta({ id: "VideoEmbedCtaListSuccessResponse" })

export const videoCtaLeadPageSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      leads: z.array(videoCtaLeadDtoSchema),
      pagination: paginationDtoSchema,
    })
  ).meta({ id: "VideoCtaLeadPageSuccessResponse" })

export type VideoCtaBody = z.infer<typeof videoCtaBodySchema>
export type VideoCtaEventBody = z.infer<typeof videoCtaEventBodySchema>
export type VideoCtaLeadBody = z.infer<typeof videoCtaLeadBodySchema>
export type VideoCtaLeadListQuery = z.infer<typeof videoCtaLeadListQuerySchema>
export type VideoCtaLeadExportQuery = z.infer<
  typeof videoCtaLeadExportQuerySchema
>
export type VideoCtaDto = z.infer<typeof videoCtaDtoSchema>
export type VideoEmbedCtaDto = z.infer<typeof videoEmbedCtaDtoSchema>
export type VideoCtaLeadDto = z.infer<typeof videoCtaLeadDtoSchema>
