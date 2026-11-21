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
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { LoaderCircleIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { videoCaptionEditFormSchema } from "../libraries.schemas"

import type { VideoCaptionEditFormValues } from "../libraries.types"
import type { VideoCaption } from "@/api/generated-api"

import { useVideoCaptionUpdateMutation } from "@/api/mutations/libraries/useVideoCaptionUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type VideoCaptionEditDialogProps = {
  organizationSlug: string
  libraryId: string
  videoId: string
  /** The track renamed; the dialog is closed while null. */
  caption: VideoCaption | null
  onClose: () => void
}

/** Renames a track, which players list by its label. */
export function VideoCaptionEditDialog({
  organizationSlug,
  libraryId,
  videoId,
  caption,
  onClose,
}: VideoCaptionEditDialogProps) {
  const { t } = useTranslation()
  const schema = videoCaptionEditFormSchema(t)
  const form = useForm<VideoCaptionEditFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    values: { label: caption?.label ?? "" },
  })
  const { mutate: updateCaption, isPending } = useVideoCaptionUpdateMutation(
    organizationSlug,
    libraryId,
    videoId,
    { onSuccess: onClose }
  )

  return (
    <Dialog
      open={Boolean(caption)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit(({ label }) => {
              if (caption) {
                updateCaption({
                  captionId: caption.id,
                  label,
                  isDefault: caption.isDefault,
                })
              }
            })(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("videos.captions.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("videos.captions.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {t("videos.captions.edit.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
