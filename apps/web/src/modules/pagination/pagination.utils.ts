import type { InfiniteData } from "@tanstack/react-query"

/** The next page to load after `lastPage`, or undefined on the last page. */
export function getNextPageParam(lastPage: {
  pagination: { page: number; totalPages: number }
}) {
  const { page, totalPages } = lastPage.pagination

  return page < totalPages ? page + 1 : undefined
}

export function flattenPages<TPage, TItem>(
  data: InfiniteData<TPage> | undefined,
  selectItems: (page: TPage) => TItem[]
) {
  return data?.pages.flatMap(selectItems) ?? []
}
