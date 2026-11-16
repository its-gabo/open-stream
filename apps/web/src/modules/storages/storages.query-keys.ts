import type { ListPageParams } from "@/modules/pagination/pagination.types"

export const STORAGES_QUERY_KEY = ["storages"] as const

/** Prefix of every paged or searched storage list of the organization. */
export const storageListQueryKey = (organizationSlug: string) =>
  [...STORAGES_QUERY_KEY, "list", organizationSlug] as const

export const storagePageQueryKey = (
  organizationSlug: string,
  params: ListPageParams
) => [...storageListQueryKey(organizationSlug), "page", params] as const

export const storageSearchQueryKey = (
  organizationSlug: string,
  search: string
) => [...storageListQueryKey(organizationSlug), "search", search] as const
