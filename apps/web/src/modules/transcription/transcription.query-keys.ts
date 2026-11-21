export const TRANSCRIPTION_PROVIDERS_QUERY_KEY = [
  "transcription-providers",
] as const

export const transcriptionProvidersQueryKey = (organizationSlug: string) =>
  [...TRANSCRIPTION_PROVIDERS_QUERY_KEY, organizationSlug] as const
