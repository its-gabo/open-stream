import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { VIDEO_CAPTION_KINDS, VIDEO_CAPTION_LIMITS } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { FileDropzone } from "@workspace/ui/components/file-dropzone"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { LoaderCircleIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { videoCaptionUploadFormSchema } from "../libraries.schemas"
import { formatCaptionLanguage, formatFileSize } from "../libraries.utils"

import type { VideoCaptionUploadFormValues } from "../libraries.types"

import { useVideoCaptionUploadMutation } from "@/api/mutations/libraries/useVideoCaptionUploadMutation"
import { getFormFields } from "@/lib/get-form-fields"

type VideoCaptionUploadDialogProps = {
  organizationSlug: string
  libraryId: string
  videoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Uploads a WebVTT or SRT file as a track; one of the same language and kind is replaced. */
export function VideoCaptionUploadDialog({
  organizationSlug,
  libraryId,
  videoId,
  open,
  onOpenChange,
}: VideoCaptionUploadDialogProps) {
  const { t, i18n } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const schema = videoCaptionUploadFormSchema(t, i18n.language)
  const form = useForm<VideoCaptionUploadFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      language: "",
      label: "",
      kind: VIDEO_CAPTION_KINDS.SUBTITLES,
    },
  })
  const isTooLarge =
    (file?.size ?? 0) > VIDEO_CAPTION_LIMITS.MAX_FILE_SIZE_BYTES
  const { mutate: uploadCaption, isPending } = useVideoCaptionUploadMutation(
    organizationSlug,
    libraryId,
    videoId,
    { onSuccess: () => onOpenChange(false) }
  )

  const language = form.watch("language")

  // Suggests the language's own name as the label, until someone types one.
  useEffect(() => {
    if (language && !form.getFieldState("label").isDirty) {
      form.setValue("label", formatCaptionLanguage(language, language), {
        shouldValidate: true,
      })
    }
  }, [form, language])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) {
          form.reset()
          setFile(null)
        }
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              if (file) uploadCaption({ ...values, file })
            })(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("videos.captions.upload.title")}</DialogTitle>
            <DialogDescription>
              {t("videos.captions.upload.description")}
            </DialogDescription>
          </DialogHeader>
          <FileDropzone
            id="video-caption-file"
            accept=".vtt,.srt,text/vtt,application/x-subrip"
            file={file}
            onFileChange={setFile}
            title={t("videos.captions.upload.dropzone_title")}
            description={t("videos.captions.upload.dropzone_description", {
              size: formatFileSize(
                VIDEO_CAPTION_LIMITS.MAX_FILE_SIZE_BYTES,
                i18n.language
              ),
            })}
            fileDetails={file && formatFileSize(file.size, i18n.language)}
            removeLabel={t("videos.captions.upload.remove_file")}
            invalid={isTooLarge}
          />
          {isTooLarge && (
            <p className="text-xs text-destructive">
              {t("videos.captions.upload.too_large", {
                size: formatFileSize(
                  VIDEO_CAPTION_LIMITS.MAX_FILE_SIZE_BYTES,
                  i18n.language
                ),
              })}
            </p>
          )}
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !file || isTooLarge}>
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {t("videos.captions.upload.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
