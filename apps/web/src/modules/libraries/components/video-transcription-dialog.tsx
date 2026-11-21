import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { VIDEO_CAPTION_KINDS } from "@workspace/shared"
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

import { DETECT_CAPTION_LANGUAGE } from "../libraries.constants"
import { videoTranscriptionFormSchema } from "../libraries.schemas"

import type { VideoTranscriptionFormValues } from "../libraries.types"

import { useVideoTranscriptionRequestMutation } from "@/api/mutations/libraries/useVideoTranscriptionRequestMutation"
import { getFormFields } from "@/lib/get-form-fields"

type VideoTranscriptionDialogProps = {
  organizationSlug: string
  libraryId: string
  videoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Asks the library's provider for a track of the video's speech. */
export function VideoTranscriptionDialog({
  organizationSlug,
  libraryId,
  videoId,
  open,
  onOpenChange,
}: VideoTranscriptionDialogProps) {
  const { t, i18n } = useTranslation()
  const schema = videoTranscriptionFormSchema(t, i18n.language)
  const form = useForm<VideoTranscriptionFormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      language: DETECT_CAPTION_LANGUAGE,
      kind: VIDEO_CAPTION_KINDS.SUBTITLES,
    },
  })
  const { mutate: requestTranscription, isPending } =
    useVideoTranscriptionRequestMutation(organizationSlug, libraryId, videoId, {
      onSuccess: () => onOpenChange(false),
    })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) form.reset()
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit(({ language, kind }) =>
              requestTranscription({
                language:
                  language === DETECT_CAPTION_LANGUAGE ? null : language,
                kind,
              })
            )(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("videos.captions.transcribe.title")}</DialogTitle>
            <DialogDescription>
              {t("videos.captions.transcribe.description")}
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
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {t("videos.captions.transcribe.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
