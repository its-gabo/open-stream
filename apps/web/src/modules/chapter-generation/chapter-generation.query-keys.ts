export const CHAPTER_GENERATION_PROVIDERS_QUERY_KEY = [
  "chapter-generation-providers",
] as const

export const chapterGenerationProvidersQueryKey = (organizationSlug: string) =>
  [...CHAPTER_GENERATION_PROVIDERS_QUERY_KEY, organizationSlug] as const
