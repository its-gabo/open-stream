import { RemoteSearchableSelect } from "@workspace/ui/components/remote-searchable-select"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { DEFAULT_STORAGE_OPTION_VALUE } from "../storages.constants"

import type { RemoteSearchableSelectOption } from "@workspace/ui/components/remote-searchable-select"

import { useStorageSearchQuery } from "@/api/queries/storages/useStorageSearchQuery"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { SEARCH_DEBOUNCE_MS } from "@/modules/pagination/pagination.constants"
import { flattenPages } from "@/modules/pagination/pagination.utils"

type StorageSelectProps = {
  organizationSlug: string
  id?: string
  /** `DEFAULT_STORAGE_OPTION_VALUE` stands for the default storage. */
  value: RemoteSearchableSelectOption
  onValueChange: (option: RemoteSearchableSelectOption) => void
  disabled?: boolean
}

/** The default storage and the organization's storages, searched and paged by the API. */
export function StorageSelect({
  organizationSlug,
  id,
  value,
  onValueChange,
  disabled,
}: StorageSelectProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearch = useDebouncedValue(
    searchValue.trim(),
    SEARCH_DEBOUNCE_MS
  )
  const { data, isFetching, hasNextPage, fetchNextPage } =
    useStorageSearchQuery(organizationSlug, debouncedSearch, {
      enabled: isOpen,
    })
  const defaultOption = {
    value: DEFAULT_STORAGE_OPTION_VALUE,
    label: t("libraries.storage_kinds.default"),
    description: t("storages.select.default_description"),
  }
  const storageOptions = flattenPages(data, (page) =>
    page.storages.map((storage) => ({
      value: storage.id,
      label: storage.name,
      description: `${storage.bucket} · ${storage.endpoint}`,
    }))
  )

  return (
    <RemoteSearchableSelect
      id={id}
      disabled={disabled}
      options={
        debouncedSearch ? storageOptions : [defaultOption, ...storageOptions]
      }
      value={value}
      onValueChange={(option) => {
        if (option) onValueChange(option)
      }}
      searchValue={searchValue}
      onSearchValueChange={setSearchValue}
      hasMore={hasNextPage}
      isLoading={isFetching || searchValue.trim() !== debouncedSearch}
      onLoadMore={() => void fetchNextPage()}
      onOpenChange={setIsOpen}
      placeholder={t("storages.select.placeholder")}
      searchPlaceholder={t("storages.select.search_placeholder")}
      emptyMessage={t("storages.select.empty")}
      loadMoreLabel={t("pagination.load_more")}
    />
  )
}
