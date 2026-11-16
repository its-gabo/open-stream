import type { ListPageParams } from "@/modules/pagination/pagination.types"

export const LIBRARIES_QUERY_KEY = ["libraries"] as const

/** Prefix of every paged or searched library list of the organization. */
export const libraryListQueryKey = (organizationSlug: string) =>
  [...LIBRARIES_QUERY_KEY, "list", organizationSlug] as const

export const libraryPageQueryKey = (
  organizationSlug: string,
  params: ListPageParams
) => [...libraryListQueryKey(organizationSlug), "page", params] as const

export const librarySearchQueryKey = (
  organizationSlug: string,
  search: string
) => [...libraryListQueryKey(organizationSlug), "search", search] as const

export const libraryQueryKey = (organizationSlug: string, libraryId: string) =>
  [...LIBRARIES_QUERY_KEY, "detail", organizationSlug, libraryId] as const

export const libraryStorageQueryKey = (
  organizationSlug: string,
  libraryId: string
) => [...LIBRARIES_QUERY_KEY, "storage", organizationSlug, libraryId] as const

export const libraryVideosQueryKey = (
  organizationSlug: string,
  libraryId: string
) => [...LIBRARIES_QUERY_KEY, "videos", organizationSlug, libraryId] as const

export const libraryApiAccessQueryKey = (
  organizationSlug: string,
  libraryId: string
) =>
  [...LIBRARIES_QUERY_KEY, "api-access", organizationSlug, libraryId] as const

export const libraryEncodingQueryKey = (
  organizationSlug: string,
  libraryId: string
) => [...LIBRARIES_QUERY_KEY, "encoding", organizationSlug, libraryId] as const

export const libraryWebhookQueryKey = (
  organizationSlug: string,
  libraryId: string
) => [...LIBRARIES_QUERY_KEY, "webhook", organizationSlug, libraryId] as const

/** Prefix of every page of the webhook's deliveries. */
export const libraryWebhookDeliveriesQueryKey = (
  organizationSlug: string,
  libraryId: string
) =>
  [
    ...LIBRARIES_QUERY_KEY,
    "webhook-deliveries",
    organizationSlug,
    libraryId,
  ] as const

export const libraryWebhookDeliveryPageQueryKey = (
  organizationSlug: string,
  libraryId: string,
  page: number
) =>
  [
    ...libraryWebhookDeliveriesQueryKey(organizationSlug, libraryId),
    page,
  ] as const

/** A storyboard never changes for a URL: reprocessing changes the URL. */
export const videoStoryboardQueryKey = (vttUrl: string) =>
  [...LIBRARIES_QUERY_KEY, "storyboard", vttUrl] as const
