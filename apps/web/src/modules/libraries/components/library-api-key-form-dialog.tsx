import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { LIBRARY_API_KEY_SCOPES } from "@workspace/shared"
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
import { Switch } from "@workspace/ui/components/switch"
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  LIBRARY_API_KEY_PRESETS,
  LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS,
} from "../libraries.constants"
import { libraryApiKeyFormSchema } from "../libraries.schemas"

import type { LibraryApiKey } from "@/api/generated-api"
import type { LibraryApiKeyFormValues } from "../libraries.types"

import { useLibraryApiKeyCreateMutation } from "@/api/mutations/libraries/useLibraryApiKeyCreateMutation"
import { useLibraryApiKeyUpdateMutation } from "@/api/mutations/libraries/useLibraryApiKeyUpdateMutation"

type LibraryApiKeyFormDialogProps = {
  organizationSlug: string
  libraryId: string
  /** The key to edit; a new key is created without one. */
  apiKey: LibraryApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the new key's secret, which is shown only once. */
  onCreated: (secret: string) => void
}

/** Names a key and chooses what it may do; the form is reset each time the dialog opens. */
export function LibraryApiKeyFormDialog({
  open,
  onOpenChange,
  ...formProps
}: LibraryApiKeyFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <LibraryApiKeyForm
            {...formProps}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type LibraryApiKeyFormProps = Omit<
  LibraryApiKeyFormDialogProps,
  "open" | "onOpenChange"
> & {
  onSaved: () => void
}

const NAME_FIELD_ID = "library-api-key-name"

function LibraryApiKeyForm({
  organizationSlug,
  libraryId,
  apiKey,
  onCreated,
  onSaved,
}: LibraryApiKeyFormProps) {
  const { t } = useTranslation()
  const form = useForm<LibraryApiKeyFormValues>({
    resolver: standardSchemaResolver(libraryApiKeyFormSchema(t)),
    mode: "onChange",
    defaultValues: {
      name: apiKey?.name ?? "",
      scopes: apiKey?.scopes ?? [...LIBRARY_API_KEY_PRESETS.read_only],
    },
  })
  const { errors } = form.formState

  const { mutate: createApiKey, isPending: isCreatePending } =
    useLibraryApiKeyCreateMutation(organizationSlug, libraryId, {
      onSuccess: ({ secret }) => {
        onSaved()
        onCreated(secret)
      },
    })
  const { mutate: updateApiKey, isPending: isUpdatePending } =
    useLibraryApiKeyUpdateMutation(organizationSlug, libraryId, {
      onSuccess: onSaved,
    })
  const isPending = isCreatePending || isUpdatePending

  const handleOnSubmit = (values: LibraryApiKeyFormValues) => {
    if (apiKey) {
      updateApiKey({ apiKeyId: apiKey.id, ...values })
    } else {
      createApiKey(values)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(handleOnSubmit)(event)
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {apiKey
            ? t("libraries.api.key_form.edit_title")
            : t("libraries.api.key_form.create_title")}
        </DialogTitle>
        <DialogDescription>
          {t("libraries.api.key_form.description")}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={NAME_FIELD_ID}>
          {t("libraries.api.key_form.name")}
        </Label>
        <Input
          id={NAME_FIELD_ID}
          autoComplete="off"
          placeholder={t("libraries.api.key_form.name_placeholder")}
          aria-invalid={Boolean(errors.name) || undefined}
          {...form.register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <Controller
        control={form.control}
        name="scopes"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-medium">
                {t("libraries.api.key_form.scopes")}
              </legend>
              <div className="flex flex-wrap gap-1">
                {Object.entries(LIBRARY_API_KEY_PRESETS).map(
                  ([preset, scopes]) => (
                    <Button
                      key={preset}
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => field.onChange([...scopes])}
                    >
                      {t(`libraries.api.presets.${preset}`)}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="divide-y rounded-lg border">
              {Object.values(LIBRARY_API_KEY_SCOPES).map((scope) => {
                const translationKey =
                  LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS[scope]
                const switchId = `library-api-key-scope-${translationKey}`

                return (
                  <div
                    key={scope}
                    className="flex items-start justify-between gap-4 p-3"
                  >
                    <div>
                      <Label htmlFor={switchId}>
                        {t(`libraries.api.scopes.${translationKey}.label`)}
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(
                          `libraries.api.scopes.${translationKey}.description`
                        )}
                      </p>
                    </div>
                    <Switch
                      id={switchId}
                      checked={field.value.includes(scope)}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, scope]
                            : field.value.filter((each) => each !== scope)
                        )
                      }
                    />
                  </div>
                )
              })}
            </div>
            {errors.scopes && (
              <p className="text-xs text-destructive">
                {errors.scopes.message}
              </p>
            )}
          </fieldset>
        )}
      />
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {apiKey
            ? t("libraries.api.key_form.save")
            : t("libraries.api.key_form.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}
