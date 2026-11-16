import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { VIDEO_UPLOAD_LIMITS } from "@workspace/shared"
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
import { FileDropzone } from "@workspace/ui/components/file-dropzone"
import { Label } from "@workspace/ui/components/label"
import { LoaderCircleIcon, PlusIcon, UploadIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useVideoUpload } from "../hooks/use-video-upload"
import { VIDEO_FILE_ACCEPT } from "../libraries.constants"
import { videoCreateFormSchema } from "../libraries.schemas"
import { formatFileSize, validateVideoFile } from "../libraries.utils"

import type { VideoCreateFormValues } from "../libraries.types"

import { useVideoCreateMutation } from "@/api/mutations/libraries/useVideoCreateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type VideoCreateDialogProps = {
  organizationSlug: string
  libraryId: string
}

/** Creates a video from a title, a file, or both; with a file its upload starts right away. */
export function VideoCreateDialog({
  organizationSlug,
  libraryId,
}: VideoCreateDialogProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const schema = videoCreateFormSchema(t)
  const { startVideoUpload } = useVideoUpload()

  const form = useForm<VideoCreateFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { title: "" },
  })

  const { mutate: createVideo, isPending: isCreatePending } =
    useVideoCreateMutation(organizationSlug, libraryId)

  const resetDialog = () => {
    form.reset()
    setFile(null)
    setFileError(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) resetDialog()
  }

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile)
    setFileError(selectedFile ? validateVideoFile(selectedFile, t) : null)
  }

  const handleOnSubmit = ({ title }: VideoCreateFormValues) => {
    if (!title && !file) {
      setFileError(t("videos.create.title_or_file_required"))
      return
    }

    if (fileError) return

    createVideo(
      { title: title || undefined, fileName: file?.name },
      {
        onSuccess: (video) => {
          if (file) {
            startVideoUpload(
              { organizationSlug, libraryId, videoId: video.id },
              file
            )
          }

          handleOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        {t("videos.create.trigger")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit(handleOnSubmit)(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("videos.create.title")}</DialogTitle>
            <DialogDescription>
              {t("videos.create.description")}
            </DialogDescription>
          </DialogHeader>
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <div className="space-y-2">
            <Label htmlFor="video-file">{t("videos.fields.file")}</Label>
            <FileDropzone
              id="video-file"
              accept={VIDEO_FILE_ACCEPT}
              file={file}
              onFileChange={handleFileChange}
              invalid={Boolean(fileError)}
              title={t("videos.create.file_dropzone")}
              description={t("videos.create.file_hint", {
                size: formatFileSize(
                  VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
                  i18n.language
                ),
              })}
              fileDetails={file && formatFileSize(file.size, i18n.language)}
              removeLabel={t("videos.create.file_remove")}
            />
            {fileError && (
              <p className="text-sm text-destructive">{fileError}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isCreatePending}>
              {isCreatePending && <LoaderCircleIcon className="animate-spin" />}
              {file ? <UploadIcon /> : <PlusIcon />}
              {file
                ? t("videos.create.submit_upload")
                : t("videos.create.submit_draft")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
