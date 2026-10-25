import { SearchIcon } from "lucide-react"
import { useState } from "react"

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

import type { Ref } from "react"
import type { FormFieldSelectOption } from "@workspace/ui/lib/form-field.types"

type SearchableSelectProps = {
  disabled?: boolean
  emptyMessage?: string
  id?: string
  invalid?: boolean
  name?: string
  onBlur?: () => void
  onValueChange: (value: string) => void
  options: FormFieldSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  triggerRef?: Ref<HTMLButtonElement>
  value?: string
}

function SearchableSelect({
  disabled = false,
  emptyMessage,
  id,
  invalid = false,
  name,
  onBlur,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  triggerRef,
  value,
}: SearchableSelectProps) {
  const [searchValue, setSearchValue] = useState("")
  const selectedOption =
    options.find((option) => option.value === value) ?? null

  return (
    <Combobox
      autoHighlight
      disabled={disabled}
      inputValue={searchValue}
      items={options}
      name={name}
      value={selectedOption}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(option, selectedValue) =>
        option.value === selectedValue.value
      }
      onInputValueChange={setSearchValue}
      onOpenChange={(open) => {
        if (open) return

        setSearchValue("")
        onBlur?.()
      }}
      onValueChange={(option) => onValueChange(option?.value ?? "")}
    >
      <ComboboxTrigger
        id={id}
        ref={triggerRef}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between px-2.5 font-normal data-placeholder:text-muted-foreground"
            aria-invalid={invalid || undefined}
          />
        }
      >
        <span className="min-w-0 flex-1 truncate text-left">
          <ComboboxValue placeholder={placeholder} />
        </span>
      </ComboboxTrigger>
      <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
        <ComboboxInput
          autoFocus
          className="focus-within:border-input/30! focus-within:ring-0! has-[[data-slot=input-group-control]:focus-visible]:border-input/30! has-[[data-slot=input-group-control]:focus-visible]:ring-0!"
          disabled={disabled}
          placeholder={searchPlaceholder ?? placeholder}
          aria-label={searchPlaceholder ?? placeholder}
          showTrigger={false}
        >
          <InputGroupAddon align="inline-start">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxSeparator className="mx-0 mt-1 mb-0" />
        <ComboboxEmpty>{emptyMessage ?? placeholder}</ComboboxEmpty>
        <ComboboxList>
          {(option: FormFieldSelectOption, index: number) => (
            <ComboboxItem
              key={option.value}
              value={option}
              index={index}
              className="py-1.5"
            >
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export { SearchableSelect }
