import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { STORAGE_PATH_VARIABLES } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import {
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  LockIcon,
  PlugZapIcon,
  SaveIcon,
} from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { STORAGE_CONNECTION_STATES } from "../storages.constants"
import { storageFormSchema } from "../storages.schemas"
import {
  buildStoragePathPreview,
  toStorageConnection,
  toStorageFormValues,
} from "../storages.utils"

import type { Storage } from "@/api/generated-api"
import type {
  StorageConnectionState,
  StorageFormValues,
} from "../storages.types"

import { useSavedStorageConnectionTestMutation } from "@/api/mutations/storages/useSavedStorageConnectionTestMutation"
import { useStorageConnectionTestMutation } from "@/api/mutations/storages/useStorageConnectionTestMutation"
import { useStorageCreateMutation } from "@/api/mutations/storages/useStorageCreateMutation"
import { useStorageUpdateMutation } from "@/api/mutations/storages/useStorageUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type StorageFormDialogProps = {
  organizationSlug: string
  /** The storage to edit; a new storage is created without one. */
  storage: Storage | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (storage: Storage) => void
}

/** Creates or edits a storage; the mounted form is reset each time the dialog opens. */
export function StorageFormDialog({
  organizationSlug,
  storage,
  open,
  onOpenChange,
  onSaved,
}: StorageFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && (
          <StorageForm
            organizationSlug={organizationSlug}
            storage={storage}
            onSaved={(saved) => {
              onOpenChange(false)
              onSaved?.(saved)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type StorageFormProps = {
  organizationSlug: string
  storage: Storage | null
  onSaved: (storage: Storage) => void
}

function StorageForm({ organizationSlug, storage, onSaved }: StorageFormProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(storage)
  const schema = storageFormSchema(t, { requireCredentials: !isEditing })
  const [connectionState, setConnectionState] =
    useState<StorageConnectionState>(STORAGE_CONNECTION_STATES.UNTESTED)

  const form = useForm<StorageFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: toStorageFormValues(storage),
  })
  const pathTemplate = useWatch({ control: form.control, name: "pathTemplate" })
  const pathPreview = buildStoragePathPreview(pathTemplate)

  const { mutate: createStorage, isPending: isCreatePending } =
    useStorageCreateMutation(organizationSlug, { onSuccess: onSaved })
  const { mutate: updateStorage, isPending: isUpdatePending } =
    useStorageUpdateMutation(organizationSlug, storage?.id ?? "", {
      onSuccess: onSaved,
    })
  const { mutate: testConnection, isPending: isTestPending } =
    useStorageConnectionTestMutation(organizationSlug)
  const { mutate: testSavedConnection, isPending: isSavedTestPending } =
    useSavedStorageConnectionTestMutation(organizationSlug)
  const isSavePending = isCreatePending || isUpdatePending
  const isTesting = isTestPending || isSavedTestPending

  const handleConnectionTested = (isReachable: boolean) =>
    setConnectionState(
      isReachable
        ? STORAGE_CONNECTION_STATES.REACHABLE
        : STORAGE_CONNECTION_STATES.UNREACHABLE
    )

  /** New credentials are tested as typed; without them, an edited storage is tested with its saved settings. */
  const handleTestConnection = async () => {
    const isValid = await form.trigger()

    if (!isValid) return

    const values = form.getValues()

    if (values.accessKeyId && values.secretAccessKey) {
      testConnection(
        {
          ...toStorageConnection(values),
          accessKeyId: values.accessKeyId,
          secretAccessKey: values.secretAccessKey,
        },
        { onSuccess: handleConnectionTested }
      )
    } else if (storage) {
      testSavedConnection(storage.id, { onSuccess: handleConnectionTested })
    }
  }

  const handleOnSubmit = (values: StorageFormValues) => {
    const settings = {
      name: values.name,
      pathTemplate: values.pathTemplate,
      ...toStorageConnection(values),
    }

    if (!storage) {
      createStorage({
        ...settings,
        accessKeyId: values.accessKeyId,
        secretAccessKey: values.secretAccessKey,
      })

      return
    }

    updateStorage({
      ...settings,
      accessKeyId: values.accessKeyId || undefined,
      secretAccessKey: values.secretAccessKey || undefined,
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onChange={() => setConnectionState(STORAGE_CONNECTION_STATES.UNTESTED)}
      onSubmit={(event) => {
        void form.handleSubmit(handleOnSubmit)(event)
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {isEditing ? t("storages.edit.title") : t("storages.create.title")}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? t("storages.edit.description", {
                hint: storage?.accessKeyIdHint,
              })
            : t("storages.create.description")}
        </DialogDescription>
      </DialogHeader>
      {storage?.isLocked && (
        <Alert>
          <LockIcon />
          <AlertTitle>{t("storages.locked_title")}</AlertTitle>
          <AlertDescription>
            {t("storages.locked_description")}
          </AlertDescription>
        </Alert>
      )}
      {/* The padding, offset by the margin, leaves room for focus rings, which the scroll area would clip. */}
      <div className="-m-1 max-h-[60vh] overflow-y-auto p-1">
        <FormFieldRenderer
          className="grid gap-4 space-y-0 sm:grid-cols-2"
          control={form.control}
          errors={form.formState.errors}
          fields={getFormFields(schema)}
        />
        <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs leading-5">
          <p className="text-muted-foreground">
            {t("storages.variables_hint")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.values(STORAGE_PATH_VARIABLES).map((variable) => (
              <code
                key={variable}
                className="rounded bg-background px-1.5 py-0.5 ring-1 ring-foreground/10"
              >{`{${variable}}`}</code>
            ))}
          </div>
          {pathPreview && (
            <p className="mt-3 break-all text-muted-foreground">
              {t("storages.path_preview")}{" "}
              <code className="text-foreground">{pathPreview}</code>
            </p>
          )}
        </div>
      </div>
      <DialogFooter className="items-center sm:justify-between">
        <span className="flex items-center gap-1.5 text-sm">
          {match(connectionState)
            .with(STORAGE_CONNECTION_STATES.REACHABLE, () => (
              <>
                <CircleCheckIcon className="size-4 text-emerald-600" />
                {t("storages.connection.reachable")}
              </>
            ))
            .with(STORAGE_CONNECTION_STATES.UNREACHABLE, () => (
              <>
                <CircleXIcon className="size-4 text-destructive" />
                {t("storages.connection.unreachable")}
              </>
            ))
            .with(STORAGE_CONNECTION_STATES.UNTESTED, () => null)
            .exhaustive()}
        </span>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isTesting || isSavePending}
            onClick={() => void handleTestConnection()}
          >
            {isTesting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <PlugZapIcon />
            )}
            {t("storages.connection.test")}
          </Button>
          <Button type="submit" disabled={isSavePending}>
            {isSavePending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {isEditing
              ? t("storages.edit.submit")
              : t("storages.create.submit")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
