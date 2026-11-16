import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { useTranslation } from "react-i18next"

import { CopyField } from "@/components/copy-field"

type LibraryApiKeySecretDialogProps = {
  /** The secret to show; the dialog is closed while null. */
  secret: string | null
  onClose: () => void
  /** Texts for another kind of secret, e.g. a webhook signing secret; an API key's by default. */
  title?: string
  description?: string
}

const SECRET_FIELD_ID = "library-api-key-secret"

/** Shows a key's secret right after it was created or rolled; it cannot be shown again. */
export function LibraryApiKeySecretDialog({
  secret,
  onClose,
  title,
  description,
}: LibraryApiKeySecretDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={Boolean(secret)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t("libraries.api.secret.title")}</DialogTitle>
          <DialogDescription>
            {description ?? t("libraries.api.secret.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={SECRET_FIELD_ID}>
            {t("libraries.api.secret.label")}
          </Label>
          <CopyField id={SECRET_FIELD_ID} value={secret ?? ""} />
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("libraries.api.secret.done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
