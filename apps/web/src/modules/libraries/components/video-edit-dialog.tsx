import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { LoaderCircleIcon, PencilIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { videoDetailsFormSchema } from "../libraries.schemas"

import type { VideoDetailsFormValues } from "../libraries.types"
import type { Video } from "@/api/generated-api"

import { useVideoUpdateMutation } from "@/api/mutations/libraries/useVideoUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type VideoEditDialogProps = {
  organizationSlug: string
  libraryId: string
  video: Video
}

/** Changes the video's title and description, which viewers see, e.g. in a playlist's episodes menu; opened from an icon button. */
export function VideoEditDialog({
  organizationSlug,
  libraryId,
  video,
}: VideoEditDialogProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const schema = videoDetailsFormSchema(t)
  const form = useForm<VideoDetailsFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    values: { title: video.title, description: video.description ?? "" },
  })
  const { mutate: updateVideo, isPending } = useVideoUpdateMutation(
    organizationSlug,
    libraryId,
    video.id,
    { onSuccess: () => setIsOpen(false) }
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)

        if (!open) form.reset()
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("videos.edit.trigger")}
            title={t("videos.edit.trigger")}
          />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => updateVideo(values))(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("videos.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("videos.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {t("videos.edit.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
