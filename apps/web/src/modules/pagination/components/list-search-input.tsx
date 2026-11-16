import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { LoaderCircleIcon, SearchIcon } from "lucide-react"

type ListSearchInputProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  isSearching?: boolean
}

export function ListSearchInput({
  value,
  onValueChange,
  placeholder,
  isSearching = false,
}: ListSearchInputProps) {
  return (
    <InputGroup className="sm:max-w-xs">
      <InputGroupAddon align="inline-start">
        {isSearching ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <SearchIcon />
        )}
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </InputGroup>
  )
}
