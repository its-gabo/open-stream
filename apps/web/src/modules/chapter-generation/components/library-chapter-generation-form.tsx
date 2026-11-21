import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { ListTreeIcon, LoaderCircleIcon, SaveIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { NO_CHAPTER_GENERATION_PROVIDER } from "../chapter-generation.constants"
import {
  libraryChapterGenerationFormSchema,
  toChapterGenerationProviderOptions,
} from "../chapter-generation.schemas"

import type {
  ChapterGenerationProvider,
  LibraryChapterGenerationSettings,
} from "@/api/generated-api"
import type { LibraryChapterGenerationFormValues } from "../chapter-generation.types"

import { useLibraryChapterGenerationUpdateMutation } from "@/api/mutations/libraries/useLibraryChapterGenerationUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type LibraryChapterGenerationFormProps = {
  organizationSlug: string
  libraryId: string
  settings: LibraryChapterGenerationSettings
  providers: ChapterGenerationProvider[]
}

/** Which of the organization's providers writes chapters for the library's videos from their captions. */
export function LibraryChapterGenerationForm({
  organizationSlug,
  libraryId,
  settings,
  providers,
}: LibraryChapterGenerationFormProps) {
  const { t } = useTranslation()
  const schema = libraryChapterGenerationFormSchema(t, {
    providerOptions: toChapterGenerationProviderOptions(providers),
  })
  const form = useForm<LibraryChapterGenerationFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      providerId: settings.providerId ?? NO_CHAPTER_GENERATION_PROVIDER,
    },
  })
  const { mutate: updateSettings, isPending } =
    useLibraryChapterGenerationUpdateMutation(organizationSlug, libraryId, {
      onSuccess: () => form.reset(form.getValues()),
    })

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ListTreeIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.chapter_generation.title")}</CardTitle>
          <CardDescription>
            {t("libraries.chapter_generation.description")}
          </CardDescription>
        </div>
      </div>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit(({ providerId }) =>
            updateSettings({
              providerId:
                providerId === NO_CHAPTER_GENERATION_PROVIDER
                  ? null
                  : providerId,
            })
          )(event)
        }}
      >
        <FormFieldRenderer
          control={form.control}
          errors={form.formState.errors}
          fields={getFormFields(schema)}
        />
        {providers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t("libraries.chapter_generation.no_providers")}{" "}
            <Link
              to="/$organizationSlug/chapter-generation"
              params={{ organizationSlug }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("libraries.chapter_generation.add_provider")}
            </Link>
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("libraries.chapter_generation.save")}
          </Button>
        </div>
      </form>
    </section>
  )
}
