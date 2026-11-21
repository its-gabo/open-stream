import {
  CHAPTER_GENERATION_MODEL,
  OPENAI_CHAPTER_GENERATION_BASE_URL,
} from "@workspace/shared"
import type {
  ChapterGenerationProviderSummary,
  LibraryChapterGenerationSettings,
} from "../types/chapter-generation.types"
import type { ChapterGenerationProviderDto } from "./chapter-generation.schemas"

/** The key itself never leaves the server, only its last characters. */
export const toChapterGenerationProviderDto = (
  provider: ChapterGenerationProviderSummary
): ChapterGenerationProviderDto => ({
  id: provider.id,
  name: provider.name,
  kind: provider.kind,
  baseUrl: provider.baseUrl ?? OPENAI_CHAPTER_GENERATION_BASE_URL,
  model: CHAPTER_GENERATION_MODEL,
  apiKeyHint: provider.apiKeyHint,
  monthlyTokenLimit: provider.monthlyTokenLimit,
  tokensUsedThisMonth: provider.tokensUsedThisMonth,
  libraryCount: provider.libraryCount,
  createdAt: provider.createdAt.toISOString(),
  updatedAt: provider.updatedAt.toISOString(),
})

export const toLibraryChapterGenerationSettingsDto = (
  settings: LibraryChapterGenerationSettings
) => ({
  providerId: settings.providerId,
})
