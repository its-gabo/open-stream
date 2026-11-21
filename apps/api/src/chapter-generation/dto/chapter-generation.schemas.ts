import {
  CHAPTER_GENERATION_PROVIDER_KINDS,
  chapterGenerationProviderCreateInputSchema,
  chapterGenerationProviderUpdateInputSchema,
  libraryChapterGenerationSettingsInputSchema,
  videoChapterSuggestionRequestInputSchema,
} from "@workspace/shared"
import { z } from "zod"
import { createApiSuccessResponseSchema } from "../../common/http/response/response.schemas"
import { videoChapterDtoSchema } from "../../libraries/dto/libraries.schemas"
import { organizationParamSchema } from "../../organizations/dto/organizations.schemas"

const chapterGenerationProviderKindSchema = z
  .enum(CHAPTER_GENERATION_PROVIDER_KINDS)
  .meta({ id: "ChapterGenerationProviderKind" })

export const chapterGenerationProviderParamSchema =
  organizationParamSchema.extend({
    providerId: z.uuid(),
  })

export const chapterGenerationProviderCreateBodySchema =
  chapterGenerationProviderCreateInputSchema.meta({
    id: "ChapterGenerationProviderCreateBody",
  })

export const chapterGenerationProviderUpdateBodySchema =
  chapterGenerationProviderUpdateInputSchema.meta({
    id: "ChapterGenerationProviderUpdateBody",
  })

export const libraryChapterGenerationUpdateBodySchema =
  libraryChapterGenerationSettingsInputSchema.meta({
    id: "LibraryChapterGenerationUpdateBody",
  })

export const videoChapterSuggestionRequestBodySchema =
  videoChapterSuggestionRequestInputSchema.meta({
    id: "VideoChapterSuggestionRequestBody",
  })

export const chapterGenerationProviderDtoSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    kind: chapterGenerationProviderKindSchema,
    /** Where requests go; OpenAI's own address for OpenAI. */
    baseUrl: z.url(),
    /** The model the provider is asked for; the same for every provider. */
    model: z.string(),
    /** Last characters of the API key; null when it has none. */
    apiKeyHint: z.string().nullable(),
    /** Tokens, read and written, it may use each calendar month (UTC); null for no limit. */
    monthlyTokenLimit: z.int().positive().nullable(),
    /** Tokens counted this calendar month (UTC), including those held for requests still running. */
    tokensUsedThisMonth: z.int().nonnegative(),
    /** Libraries writing chapters with it; it can be deleted only once none do. */
    libraryCount: z.int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "ChapterGenerationProvider" })

export const libraryChapterGenerationSettingsDtoSchema = z
  .object({
    providerId: z.uuid().nullable(),
  })
  .meta({ id: "LibraryChapterGenerationSettings" })

export const chapterGenerationConnectionTestDtoSchema = z
  .object({
    isReachable: z.boolean(),
    isAuthorized: z.boolean(),
  })
  .meta({ id: "ChapterGenerationConnectionTest" })

export const chapterGenerationProviderListSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ providers: z.array(chapterGenerationProviderDtoSchema) })
  ).meta({ id: "ChapterGenerationProviderListSuccessResponse" })

export const chapterGenerationProviderSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ provider: chapterGenerationProviderDtoSchema })
  ).meta({ id: "ChapterGenerationProviderSuccessResponse" })

export const chapterGenerationConnectionTestSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ connection: chapterGenerationConnectionTestDtoSchema })
  ).meta({ id: "ChapterGenerationConnectionTestSuccessResponse" })

export const libraryChapterGenerationSettingsSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ chapterGeneration: libraryChapterGenerationSettingsDtoSchema })
  ).meta({ id: "LibraryChapterGenerationSettingsSuccessResponse" })

export const videoChapterSuggestionsSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      /** Proposed chapters, not saved; replacing the video's chapters with them is up to the member. */
      chapters: z.array(videoChapterDtoSchema),
    })
  ).meta({ id: "VideoChapterSuggestionsSuccessResponse" })

export type ChapterGenerationProviderCreateBody = z.infer<
  typeof chapterGenerationProviderCreateBodySchema
>
export type ChapterGenerationProviderUpdateBody = z.infer<
  typeof chapterGenerationProviderUpdateBodySchema
>
export type LibraryChapterGenerationUpdateBody = z.infer<
  typeof libraryChapterGenerationUpdateBodySchema
>
export type VideoChapterSuggestionRequestBody = z.infer<
  typeof videoChapterSuggestionRequestBodySchema
>
export type ChapterGenerationProviderDto = z.infer<
  typeof chapterGenerationProviderDtoSchema
>
