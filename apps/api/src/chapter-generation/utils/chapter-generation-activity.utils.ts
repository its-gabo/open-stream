import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"
import type { ChapterGenerationProviderRecord } from "../../db/schema"
import type { LibraryChapterGenerationSettings } from "../types/chapter-generation.types"

export const chapterGenerationProviderActivityResource = (
  provider: Pick<ChapterGenerationProviderRecord, "id" | "name">
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.CHAPTER_GENERATION_PROVIDER,
  id: provider.id,
  label: provider.name,
})

/** What the activity log keeps of a provider: where it is, never its key. */
export const toChapterGenerationProviderActivityValues = (
  provider: Pick<
    ChapterGenerationProviderRecord,
    "name" | "kind" | "baseUrl" | "apiKeyHint" | "monthlyTokenLimit"
  >
) => ({
  name: provider.name,
  kind: provider.kind,
  baseUrl: provider.baseUrl,
  apiKeyHint: provider.apiKeyHint,
  monthlyTokenLimit: provider.monthlyTokenLimit,
})

export const toLibraryChapterGenerationActivityValues = (
  settings: LibraryChapterGenerationSettings
) => ({
  chapterGenerationProviderId: settings.providerId,
})
