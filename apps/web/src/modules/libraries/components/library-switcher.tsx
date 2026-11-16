import { useNavigate } from "@tanstack/react-router"
import { RemoteSearchableSelect } from "@workspace/ui/components/remote-searchable-select"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { buildLibraryPath } from "../libraries.utils"

import type { Library } from "@/api/generated-api"

import { useLibrarySearchQuery } from "@/api/queries/libraries/useLibrarySearchQuery"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { SEARCH_DEBOUNCE_MS } from "@/modules/pagination/pagination.constants"
import { flattenPages } from "@/modules/pagination/pagination.utils"

type LibrarySwitcherProps = {
  organizationSlug: string
  library: Library
  /** The library page to open in the chosen library, e.g. `storage`. */
  pathSuffix: string
}

/** The library's name as a select of the organization's libraries, searched and paged by the API. */
export function LibrarySwitcher({
  organizationSlug,
  library,
  pathSuffix,
}: LibrarySwitcherProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearch = useDebouncedValue(
    searchValue.trim(),
    SEARCH_DEBOUNCE_MS
  )
  const { data, isFetching, hasNextPage, fetchNextPage } =
    useLibrarySearchQuery(organizationSlug, debouncedSearch, {
      enabled: isOpen,
    })
  const options = flattenPages(data, (page) =>
    page.libraries.map(({ id, name, videoCount }) => ({
      value: id,
      label: name,
      description: t("libraries.switcher.video_count", { count: videoCount }),
    }))
  )

  return (
    <RemoteSearchableSelect
      options={options}
      value={{ value: library.id, label: library.name }}
      onValueChange={(option) => {
        if (!option || option.value === library.id) return

        void navigate({
          href: buildLibraryPath(organizationSlug, option.value, pathSuffix),
        })
      }}
      searchValue={searchValue}
      onSearchValueChange={setSearchValue}
      hasMore={hasNextPage}
      isLoading={isFetching || searchValue.trim() !== debouncedSearch}
      onLoadMore={() => void fetchNextPage()}
      onOpenChange={setIsOpen}
      searchPlaceholder={t("libraries.switcher.search_placeholder")}
      emptyMessage={t("libraries.switcher.empty")}
      loadMoreLabel={t("pagination.load_more")}
      trigger={
        <button
          type="button"
          aria-label={t("libraries.switcher.label")}
          className="-mx-1.5 flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
        />
      }
      triggerContent={
        <span className="truncate font-heading text-xl font-semibold">
          {library.name}
        </span>
      }
    />
  )
}
