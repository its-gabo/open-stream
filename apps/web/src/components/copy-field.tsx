import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { CopyIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type CopyFieldProps = {
  id?: string
  value: string
}

/** A read-only value with a button that copies it. */
export function CopyField({ id, value }: CopyFieldProps) {
  const { t } = useTranslation()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t("common.copied"))
    } catch {
      toast.error(t("common.copy_failed"))
    }
  }

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        readOnly
        value={value}
        className="font-mono text-xs"
        onFocus={(event) => event.currentTarget.select()}
      />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("common.copy")}
          onClick={() => void handleCopy()}
        >
          <CopyIcon />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}
