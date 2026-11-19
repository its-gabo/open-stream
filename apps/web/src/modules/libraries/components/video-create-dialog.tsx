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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { LinkIcon, LoaderCircleIcon, PlusIcon, UploadIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { useVideoUpload } from "../hooks/use-video-upload"
import { VIDEO_FILE_ACCEPT, VIDEO_SOURCES } from "../libraries.constants"
import { videoCreateFormSchema } from "../libraries.schemas"
import {
  formatFileSize,
  validateVideoFile,
  validateVideoImportUrl,
  videoFileNameFromImportUrl,
} from "../libraries.utils"

import type { VideoCreateFormValues, VideoSource } from "../libraries.types"

import { useVideoCreateMutation } from "@/api/mutations/libraries/useVideoCreateMutation"
import { useVideoImportMutation } from "@/api/mutations/libraries/useVideoImportMutation"
import { getFormFields } from "@/lib/get-form-fields"

type VideoCreateDialogProps = {
  organizationSlug: string
  libraryId: string
}

/**
 * Creates a video from a title, a file, a URL, or a title with either; a
 * file's upload starts right away, and a URL is handed to the server to
 * download.
 */
export function VideoCreateDialog({
  organizationSlug,
  libraryId,
}: VideoCreateDialogProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<VideoSource>(VIDEO_SOURCES.FILE)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [importUrl, setImportUrl] = useState("")
  const [importUrlError, setImportUrlError] = useState<string | null>(null)
  // A draft created for an import the server refused, so retrying imports into it rather than adding another.
  const [importDraftId, setImportDraftId] = useState<string | null>(null)
  const schema = videoCreateFormSchema(t)
  const { startVideoUpload } = useVideoUpload()

  const form = useForm<VideoCreateFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { title: "" },
  })

  const { mutate: createVideo, isPending: isCreatePending } =
    useVideoCreateMutation(organizationSlug, libraryId)
  const { mutate: importVideo, isPending: isImportPending } =
    useVideoImportMutation(organizationSlug, libraryId)

  const resetDialog = () => {
    form.reset()
    setSource(VIDEO_SOURCES.FILE)
    setFile(null)
    setFileError(null)
    setImportUrl("")
    setImportUrlError(null)
    setImportDraftId(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) resetDialog()
  }

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile)
    setFileError(selectedFile ? validateVideoFile(selectedFile, t) : null)
  }

  const handleImportUrlChange = (url: string) => {
    setImportUrl(url)
    setImportUrlError(null)
  }

  const submitWithFile = (title: string) => {
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

  const submitWithUrl = (title: string) => {
    const url = importUrl.trim()
    const urlError = validateVideoImportUrl(url, t)

    if (urlError) {
      setImportUrlError(urlError)
      return
    }

    const startImport = (videoId: string) =>
      importVideo(
        { videoId, url },
        { onSuccess: () => handleOpenChange(false) }
      )

    if (importDraftId) {
      startImport(importDraftId)
      return
    }

    createVideo(
      {
        title: title || undefined,
        fileName: videoFileNameFromImportUrl(url),
      },
      {
        onSuccess: (video) => {
          setImportDraftId(video.id)
          startImport(video.id)
        },
      }
    )
  }

  const handleOnSubmit = ({ title }: VideoCreateFormValues) =>
    match(source)
      .with(VIDEO_SOURCES.FILE, () => submitWithFile(title))
      .with(VIDEO_SOURCES.URL, () => submitWithUrl(title))
      .exhaustive()

  const isPending = isCreatePending || isImportPending

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
          <Tabs
            value={source}
            onValueChange={(value: VideoSource) => setSource(value)}
          >
            <TabsList className="w-full">
              <TabsTrigger value={VIDEO_SOURCES.FILE}>
                <UploadIcon />
                {t("videos.create.source_file")}
              </TabsTrigger>
              <TabsTrigger value={VIDEO_SOURCES.URL}>
                <LinkIcon />
                {t("videos.create.source_url")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value={VIDEO_SOURCES.FILE} className="space-y-2">
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
            </TabsContent>
            <TabsContent value={VIDEO_SOURCES.URL} className="space-y-2">
              <Label htmlFor="video-import-url">
                {t("videos.fields.import_url")}
              </Label>
              <Input
                id="video-import-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder={t("videos.fields.import_url_placeholder")}
                value={importUrl}
                aria-invalid={Boolean(importUrlError)}
                onChange={(event) => handleImportUrlChange(event.target.value)}
              />
              {importUrlError ? (
                <p className="text-sm text-destructive">{importUrlError}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("videos.create.import_url_hint", {
                    size: formatFileSize(
                      VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
                      i18n.language
                    ),
                  })}
                </p>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {match({ source, hasFile: Boolean(file) })
                .with({ source: VIDEO_SOURCES.URL }, () => (
                  <>
                    <LinkIcon />
                    {t("videos.create.submit_import")}
                  </>
                ))
                .with({ hasFile: true }, () => (
                  <>
                    <UploadIcon />
                    {t("videos.create.submit_upload")}
                  </>
                ))
                .otherwise(() => (
                  <>
                    <PlusIcon />
                    {t("videos.create.submit_draft")}
                  </>
                ))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
