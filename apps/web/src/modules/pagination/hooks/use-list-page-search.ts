import { PAGINATION_LIMITS } from "@workspace/shared"
import { useEffect, useState } from "react"

import { SEARCH_DEBOUNCE_MS } from "../pagination.constants"

import type { ListPageParams, ListPageSearch } from "../pagination.types"

import { useDebouncedValue } from "@/hooks/use-debounced-value"

/**
 * The page and search of a paged list kept in the URL: typing updates the
 * search after a pause and goes back to the first page.
 */
export function useListPageSearch(
  search: ListPageSearch,
  onSearchChange: (search: ListPageSearch) => void
) {
  const [searchInput, setSearchInput] = useState(search.search ?? "")
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS
  )
  const currentSearch = search.search ?? ""

  useEffect(() => {
    if (debouncedSearch === currentSearch) return

    onSearchChange({ search: debouncedSearch || undefined, page: undefined })
  }, [debouncedSearch, currentSearch, onSearchChange])

  const params: ListPageParams = {
    page: search.page ?? 1,
    pageSize: PAGINATION_LIMITS.DEFAULT_PAGE_SIZE,
    search: currentSearch,
  }

  return {
    params,
    searchInput,
    setSearchInput,
    isSearchPending: searchInput.trim() !== currentSearch,
    setPage: (page: number) =>
      onSearchChange({ ...search, page: page > 1 ? page : undefined }),
  }
}
