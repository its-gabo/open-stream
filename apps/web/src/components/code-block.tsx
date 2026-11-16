import { Button } from "@workspace/ui/components/button"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { COPIED_ICON_MS } from "./code-block.constants"

type CodeBlockProps = {
  code: string
}

/** A snippet with a copy button; long lines scroll inside the block instead of widening the page. */
export function CodeBlock({ code }: CodeBlockProps) {
  const { t } = useTranslation()
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), COPIED_ICON_MS)
    } catch {
      toast.error(t("common.copy_failed"))
    }
  }

  return (
    <div className="relative min-w-0 rounded-lg border bg-muted/30">
      <pre className="overflow-x-auto p-3 pr-12 text-xs leading-5">
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-2 right-2"
        aria-label={t("common.copy")}
        onClick={() => void handleCopy()}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}
