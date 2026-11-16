import { LoaderCircleIcon, SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@workspace/ui/components/combobox"
import { InputGroupAddon } from "@workspace/ui/components/input-group"

import type { ReactElement, ReactNode, UIEvent } from "react"

export type RemoteSearchableSelectOption = {
  value: string
  label: string
  description?: string
}

type RemoteSearchableSelectProps = {
  /** Options of the pages loaded so far, already filtered by the server. */
  options: RemoteSearchableSelectOption[]
  value: RemoteSearchableSelectOption | null
  onValueChange: (option: RemoteSearchableSelectOption | null) => void
  searchValue: string
  onSearchValueChange: (searchValue: string) => void
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  id?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loadMoreLabel?: string
  /** Replaces the default outline button trigger. */
  trigger?: ReactElement
  /** Replaces the selected option's label inside the trigger. */
  triggerContent?: ReactNode
}

const LOAD_MORE_THRESHOLD_PX = 48

/**
 * A select whose options are searched and paged by the server: typing updates
 * `searchValue`, and scrolling to the end of the list asks for the next page.
 */
function RemoteSearchableSelect({
  options,
  value,
  onValueChange,
  searchValue,
  onSearchValueChange,
  hasMore,
  isLoading,
  onLoadMore,
  onOpenChange,
  disabled = false,
  id,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  loadMoreLabel,
  trigger,
  triggerContent,
}: RemoteSearchableSelectProps) {
  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    const list = event.currentTarget
    const distanceToEnd = list.scrollHeight - list.scrollTop - list.clientHeight

    if (hasMore && !isLoading && distanceToEnd < LOAD_MORE_THRESHOLD_PX) {
      onLoadMore()
    }
  }

  return (
    <Combobox
      autoHighlight
      disabled={disabled}
      filter={null}
      items={options}
      inputValue={searchValue}
      value={value}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(option, selectedValue) =>
        option.value === selectedValue.value
      }
      onInputValueChange={(nextValue, { reason }) => {
        if (reason === "input-change" || reason === "input-clear") {
          onSearchValueChange(nextValue)
        }
      }}
      onOpenChange={(open) => {
        if (!open) onSearchValueChange("")
        onOpenChange?.(open)
      }}
      onValueChange={onValueChange}
    >
      <ComboboxTrigger
        id={id}
        disabled={disabled}
        render={
          trigger ?? (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between px-2.5 font-normal data-placeholder:text-muted-foreground"
            />
          )
        }
      >
        {triggerContent ?? (
          <span className="min-w-0 flex-1 truncate text-left">
            <ComboboxValue placeholder={placeholder} />
          </span>
        )}
      </ComboboxTrigger>
      <ComboboxContent className="w-(--anchor-width) min-w-72">
        <ComboboxInput
          autoFocus
          className="focus-within:border-input/30! focus-within:ring-0! has-[[data-slot=input-group-control]:focus-visible]:border-input/30! has-[[data-slot=input-group-control]:focus-visible]:ring-0!"
          disabled={disabled}
          placeholder={searchPlaceholder ?? placeholder}
          aria-label={searchPlaceholder ?? placeholder}
          showTrigger={false}
        >
          <InputGroupAddon align="inline-start">
            {isLoading ? (
              <LoaderCircleIcon className="size-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <SearchIcon className="size-4 shrink-0 opacity-50" />
            )}
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxSeparator className="mx-0 mt-1 mb-0" />
        {!isLoading && <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>}
        <ComboboxList onScroll={handleListScroll}>
          {(option: RemoteSearchableSelectOption, index: number) => (
            <ComboboxItem
              key={option.value}
              value={option}
              index={index}
              className="py-1.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.label}</span>
                {option.description && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
        {hasMore && (
          <div className="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={isLoading}
              onClick={onLoadMore}
            >
              {isLoading && <LoaderCircleIcon className="animate-spin" />}
              {loadMoreLabel}
            </Button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

export { RemoteSearchableSelect }
