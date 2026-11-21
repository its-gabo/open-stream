import type { z } from "zod"
import type { CHAPTER_GENERATION_PROVIDER_KINDS } from "../constants/chapter-generation.constants"
import type {
  chapterGenerationProviderCreateInputSchema,
  chapterGenerationProviderUpdateInputSchema,
  libraryChapterGenerationSettingsInputSchema,
  videoChapterSuggestionRequestInputSchema,
} from "../schemas/chapter-generation.schemas"

type ValueOf<T> = T[keyof T]

export type ChapterGenerationProviderKind = ValueOf<
  typeof CHAPTER_GENERATION_PROVIDER_KINDS
>

export type ChapterGenerationProviderCreateInput = z.output<
  typeof chapterGenerationProviderCreateInputSchema
>
export type ChapterGenerationProviderUpdateInput = z.output<
  typeof chapterGenerationProviderUpdateInputSchema
>
export type LibraryChapterGenerationSettingsInput = z.output<
  typeof libraryChapterGenerationSettingsInputSchema
>
export type VideoChapterSuggestionRequestInput = z.output<
  typeof videoChapterSuggestionRequestInputSchema
>
