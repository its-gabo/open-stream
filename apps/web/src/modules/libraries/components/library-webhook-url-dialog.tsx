import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { libraryWebhookFormSchema } from "../libraries.schemas"

import type { LibraryWebhook } from "@/api/generated-api"
import type { LibraryWebhookFormValues } from "../libraries.types"

import { useLibraryWebhookSaveMutation } from "@/api/mutations/libraries/useLibraryWebhookSaveMutation"

type LibraryWebhookUrlDialogProps = {
  organizationSlug: string
  libraryId: string
  /** The webhook whose URL changes; null to add one. */
  webhook: LibraryWebhook | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Gets the signing secret of a new webhook, which is shown only once. */
  onCreated: (signingSecret: string) => void
}

const URL_FIELD_ID = "library-webhook-url"

/** Adds the webhook or changes its URL; the form is reset each time the dialog opens. */
export function LibraryWebhookUrlDialog({
  open,
  onOpenChange,
  ...props
}: LibraryWebhookUrlDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <LibraryWebhookUrlForm
            {...props}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function LibraryWebhookUrlForm({
  organizationSlug,
  libraryId,
  webhook,
  onCreated,
  onSaved,
}: Omit<LibraryWebhookUrlDialogProps, "open" | "onOpenChange"> & {
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const form = useForm<LibraryWebhookFormValues>({
    resolver: standardSchemaResolver(libraryWebhookFormSchema(t)),
    defaultValues: { url: webhook?.url ?? "" },
  })
  const urlError = form.formState.errors.url

  const { mutate: saveWebhook, isPending } = useLibraryWebhookSaveMutation(
    organizationSlug,
    libraryId,
    {
      onSuccess: ({ signingSecret }) => {
        onSaved()

        if (signingSecret) onCreated(signingSecret)
      },
    }
  )

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit((values) => saveWebhook(values))(event)
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {webhook
            ? t("libraries.webhooks.url_dialog.edit_title")
            : t("libraries.webhooks.url_dialog.create_title")}
        </DialogTitle>
        <DialogDescription>
          {t("libraries.webhooks.url_dialog.description")}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={URL_FIELD_ID}>
          {t("libraries.webhooks.url_label")}
        </Label>
        <Input
          id={URL_FIELD_ID}
          type="url"
          inputMode="url"
          autoComplete="off"
          autoFocus
          placeholder="https://example.com/webhooks/openstream"
          aria-invalid={Boolean(urlError) || undefined}
          {...form.register("url")}
        />
        {urlError && (
          <p className="text-xs text-destructive">{urlError.message}</p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {webhook
            ? t("libraries.webhooks.save")
            : t("libraries.webhooks.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}
