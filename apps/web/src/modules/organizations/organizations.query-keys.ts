export const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const

export const ORGANIZATION_CONTEXT_QUERY_KEY = [
  ...ORGANIZATIONS_QUERY_KEY,
  "context",
] as const

export const organizationQueryKey = (slug: string) =>
  [...ORGANIZATIONS_QUERY_KEY, "detail", slug] as const

export const organizationTeamQueryKey = (slug: string) =>
  [...ORGANIZATIONS_QUERY_KEY, "team", slug] as const

export const organizationSlugSuggestionQueryKey = (name: string) =>
  [...ORGANIZATIONS_QUERY_KEY, "slug-suggestion", name] as const
