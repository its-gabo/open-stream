import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { Label } from "@workspace/ui/components/label"
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
import { Switch } from "@workspace/ui/components/switch"
import { AudioLinesIcon, LoaderCircleIcon, SaveIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { NO_TRANSCRIPTION_PROVIDER } from "../transcription.constants"
import {
  libraryTranscriptionFormSchema,
  toProviderOptions,
} from "../transcription.schemas"

import type {
  LibraryTranscriptionSettings,
  TranscriptionProvider,
} from "@/api/generated-api"
import type { LibraryTranscriptionFormValues } from "../transcription.types"

import { useLibraryTranscriptionUpdateMutation } from "@/api/mutations/libraries/useLibraryTranscriptionUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"
import { DETECT_CAPTION_LANGUAGE } from "@/modules/libraries/libraries.constants"
import { toCaptionLanguageOptions } from "@/modules/libraries/libraries.utils"

type LibraryTranscriptionFormProps = {
  organizationSlug: string
  libraryId: string
  settings: LibraryTranscriptionSettings
  providers: TranscriptionProvider[]
}

/**
 * Which of the organization's providers transcribes the library's videos,
 * in which language, and whether each video is transcribed once processed.
 */
export function LibraryTranscriptionForm({
  organizationSlug,
  libraryId,
  settings,
  providers,
}: LibraryTranscriptionFormProps) {
  const { t, i18n } = useTranslation()
  const schema = libraryTranscriptionFormSchema(t, {
    providerOptions: toProviderOptions(providers),
  })
  const form = useForm<LibraryTranscriptionFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      providerId: settings.providerId ?? NO_TRANSCRIPTION_PROVIDER,
      language: settings.language ?? DETECT_CAPTION_LANGUAGE,
      autoTranscribe: settings.autoTranscribe,
    },
  })
  const autoTranscribeError = form.formState.errors.autoTranscribe
  const { mutate: updateSettings, isPending } =
    useLibraryTranscriptionUpdateMutation(organizationSlug, libraryId, {
      onSuccess: () => form.reset(form.getValues()),
    })
  const languageOptions = [
    {
      value: DETECT_CAPTION_LANGUAGE,
      label: t("videos.captions.fields.detect_language"),
    },
    ...toCaptionLanguageOptions(i18n.language),
  ]

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <AudioLinesIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.transcription.title")}</CardTitle>
          <CardDescription>
            {t("libraries.transcription.description")}
          </CardDescription>
        </div>
      </div>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit((values) =>
            updateSettings({
              providerId:
                values.providerId === NO_TRANSCRIPTION_PROVIDER
                  ? null
                  : values.providerId,
              language:
                values.language === DETECT_CAPTION_LANGUAGE
                  ? null
                  : values.language,
              autoTranscribe: values.autoTranscribe,
            })
          )(event)
        }}
      >
        <FormFieldRenderer
          control={form.control}
          errors={form.formState.errors}
          fields={getFormFields(schema).filter(
            ({ name }) => name === "providerId"
          )}
        />
        {providers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t("libraries.transcription.no_providers")}{" "}
            <Link
              to="/$organizationSlug/transcription"
              params={{ organizationSlug }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("libraries.transcription.add_provider")}
            </Link>
          </p>
        )}
        <Controller
          control={form.control}
          name="language"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor="library-transcription-language">
                {t("libraries.transcription.fields.language")}
              </Label>
              <SearchableSelect
                id="library-transcription-language"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                options={languageOptions}
              />
              <p className="text-xs text-muted-foreground">
                {t("libraries.transcription.fields.language_hint")}
              </p>
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="autoTranscribe"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <Label htmlFor="library-auto-transcribe">
                  {t("libraries.transcription.fields.auto_transcribe")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("libraries.transcription.fields.auto_transcribe_hint")}
                </p>
                {autoTranscribeError && (
                  <p className="mt-1 text-xs text-destructive">
                    {autoTranscribeError.message}
                  </p>
                )}
              </div>
              <Switch
                id="library-auto-transcribe"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("libraries.transcription.save")}
          </Button>
        </div>
      </form>
    </section>
  )
}
