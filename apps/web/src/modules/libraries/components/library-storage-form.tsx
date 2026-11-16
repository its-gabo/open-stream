import { LIBRARY_STORAGE_KINDS } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
  DatabaseIcon,
  LoaderCircleIcon,
  LockIcon,
  PlusIcon,
  SaveIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { LibraryStorageSettings } from "@/api/generated-api"
import type { RemoteSearchableSelectOption } from "@workspace/ui/components/remote-searchable-select"

import { useLibraryStorageUpdateMutation } from "@/api/mutations/libraries/useLibraryStorageUpdateMutation"
import { StorageFormDialog } from "@/modules/storages/components/storage-form-dialog"
import { StorageSelect } from "@/modules/storages/components/storage-select"
import { DEFAULT_STORAGE_OPTION_VALUE } from "@/modules/storages/storages.constants"

type LibraryStorageFormProps = {
  organizationSlug: string
  libraryId: string
  storage: LibraryStorageSettings
}

const STORAGE_SELECT_ID = "library-storage-select"

/** Assigns one of the organization's storages to the library, or a new one created here. */
export function LibraryStorageForm({
  organizationSlug,
  libraryId,
  storage,
}: LibraryStorageFormProps) {
  const { t } = useTranslation()
  const isCustom = storage.kind === LIBRARY_STORAGE_KINDS.CUSTOM
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedOption, setSelectedOption] =
    useState<RemoteSearchableSelectOption>(
      storage.custom
        ? { value: storage.custom.id, label: storage.custom.name }
        : {
            value: DEFAULT_STORAGE_OPTION_VALUE,
            label: t("libraries.storage_kinds.default"),
          }
    )
  const selectedStorageId =
    selectedOption.value === DEFAULT_STORAGE_OPTION_VALUE
      ? null
      : selectedOption.value
  const isSelectionChanged = selectedStorageId !== (storage.custom?.id ?? null)

  const { mutate: assignStorage, isPending: isAssignPending } =
    useLibraryStorageUpdateMutation(organizationSlug, libraryId)

  return (
    <>
      <section className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DatabaseIcon className="size-5" />
            </span>
            <div>
              <CardTitle>{t("libraries.storage.current_title")}</CardTitle>
              <CardDescription>
                {storage.custom
                  ? t("libraries.storage.custom_description", {
                      name: storage.custom.name,
                      bucket: storage.custom.bucket,
                      endpoint: storage.custom.endpoint,
                      template: storage.custom.pathTemplate,
                    })
                  : t("libraries.storage.default_description", {
                      template: storage.defaultPathTemplate,
                    })}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isCustom ? "default" : "secondary"}>
            {storage.custom?.name ??
              t(`libraries.storage_kinds.${storage.kind}`)}
          </Badge>
        </div>
        {storage.isLocked && (
          <Alert>
            <LockIcon />
            <AlertTitle>{t("libraries.storage.locked_title")}</AlertTitle>
            <AlertDescription>
              {t("libraries.storage.locked_description")}
            </AlertDescription>
          </Alert>
        )}
      </section>
      {!storage.isLocked && (
        <>
          <Separator />
          <section className="flex flex-col gap-4 p-4 sm:p-5">
            <div>
              <CardTitle>{t("libraries.storage.choose_title")}</CardTitle>
              <CardDescription>
                {t("libraries.storage.choose_description")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={STORAGE_SELECT_ID}>
                {t("libraries.storage.storage_field")}
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <StorageSelect
                    id={STORAGE_SELECT_ID}
                    organizationSlug={organizationSlug}
                    value={selectedOption}
                    onValueChange={setSelectedOption}
                    disabled={isAssignPending}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <PlusIcon />
                  {t("libraries.storage.create_storage")}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={!isSelectionChanged || isAssignPending}
                onClick={() => assignStorage({ storageId: selectedStorageId })}
              >
                {isAssignPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <SaveIcon />
                )}
                {t("libraries.storage.save")}
              </Button>
            </div>
          </section>
        </>
      )}
      <StorageFormDialog
        organizationSlug={organizationSlug}
        storage={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSaved={(created) => {
          setSelectedOption({ value: created.id, label: created.name })
          assignStorage({ storageId: created.id })
        }}
      />
    </>
  )
}
