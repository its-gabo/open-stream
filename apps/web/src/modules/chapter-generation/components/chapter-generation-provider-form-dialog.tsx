import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import {
  CHAPTER_GENERATION_MODEL,
  CHAPTER_GENERATION_PROVIDER_KINDS,
  CHAPTER_GENERATION_PROVIDER_LIMITS,
} from "@workspace/shared"
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
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { chapterGenerationProviderFormSchema } from "../chapter-generation.schemas"

import type { ChapterGenerationProvider } from "@/api/generated-api"
import type { ChapterGenerationProviderFormValues } from "../chapter-generation.types"
import type { ChapterGenerationProviderSave } from "@/api/mutations/chapter-generation/useChapterGenerationProviderSaveMutation"

import { useChapterGenerationProviderSaveMutation } from "@/api/mutations/chapter-generation/useChapterGenerationProviderSaveMutation"
import { getFormFields } from "@/lib/get-form-fields"
import { parseUsageLimit, toUsageLimitInput } from "@/lib/usage-limit"

type ChapterGenerationProviderFormDialogProps = {
  organizationSlug: string
  /** The provider to edit; a new one is created without it. */
  provider: ChapterGenerationProvider | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Connects OpenAI or a server of one's own, or edits a provider; the form is reset each time the dialog opens. */
export function ChapterGenerationProviderFormDialog({
  organizationSlug,
  provider,
  open,
  onOpenChange,
}: ChapterGenerationProviderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && (
          <ChapterGenerationProviderForm
            organizationSlug={organizationSlug}
            provider={provider}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type ChapterGenerationProviderFormProps = {
  organizationSlug: string
  provider: ChapterGenerationProvider | null
  onSaved: () => void
}

function ChapterGenerationProviderForm({
  organizationSlug,
  provider,
  onSaved,
}: ChapterGenerationProviderFormProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(provider)
  const schema = chapterGenerationProviderFormSchema(t, { isEditing })
  const form = useForm<ChapterGenerationProviderFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      kind: provider?.kind ?? CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI,
      name: provider?.name ?? "",
      baseUrl:
        provider?.kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE
          ? provider.baseUrl
          : "",
      apiKey: "",
      monthlyTokenLimit: toUsageLimitInput(provider?.monthlyTokenLimit ?? null),
    },
  })
  const kind = useWatch({ control: form.control, name: "kind" })
  const baseUrl = useWatch({ control: form.control, name: "baseUrl" })
  // The API drops a saved key when the address changes, so it never reaches another server.
  const isSavedKeyDropped =
    provider?.kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE &&
    provider.apiKeyHint !== null &&
    baseUrl.trim() !== provider.baseUrl
  const { mutate: saveProvider, isPending } =
    useChapterGenerationProviderSaveMutation(organizationSlug, {
      onSuccess: onSaved,
    })
  // The kind is chosen once; a server of one's own also needs its address.
  const fields = getFormFields(schema).filter(({ name }) =>
    match(name)
      .with("kind", () => !isEditing)
      .with(
        "baseUrl",
        () => kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE
      )
      .otherwise(() => true)
  )

  const toSave = (
    values: ChapterGenerationProviderFormValues
  ): ChapterGenerationProviderSave => {
    const apiKey = values.apiKey || null
    const monthlyTokenLimit = parseUsageLimit(
      values.monthlyTokenLimit,
      CHAPTER_GENERATION_PROVIDER_LIMITS.MONTHLY_TOKEN_LIMIT_MAX
    )

    if (provider) {
      return {
        providerId: provider.id,
        payload: {
          name: values.name,
          baseUrl:
            provider.kind ===
            CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE
              ? values.baseUrl
              : null,
          ...(apiKey && { apiKey }),
          monthlyTokenLimit,
        },
      }
    }

    return {
      providerId: null,
      payload: match(values.kind)
        .with(CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI, (openAi) => ({
          kind: openAi,
          name: values.name,
          apiKey: apiKey ?? "",
          monthlyTokenLimit,
        }))
        .with(
          CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE,
          (compatible) => ({
            kind: compatible,
            name: values.name,
            baseUrl: values.baseUrl,
            apiKey,
            monthlyTokenLimit,
          })
        )
        .exhaustive(),
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit((values) => saveProvider(toSave(values)))(event)
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {isEditing
            ? t("chapter_generation.edit.title")
            : t("chapter_generation.create.title")}
        </DialogTitle>
        <DialogDescription>
          {t(`chapter_generation.kinds.${kind}.description`)}
        </DialogDescription>
      </DialogHeader>
      <FormFieldRenderer
        control={form.control}
        errors={form.formState.errors}
        fields={fields}
      />
      <p className="text-xs text-muted-foreground">
        {t("chapter_generation.hints.model", {
          model: CHAPTER_GENERATION_MODEL,
        })}{" "}
        {kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI
          ? t("chapter_generation.hints.openai")
          : t("chapter_generation.hints.openai_compatible")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("chapter_generation.hints.monthly_limit")}
      </p>
      {isSavedKeyDropped && (
        <p className="text-xs text-destructive">
          {t("chapter_generation.hints.address_changed")}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isEditing
            ? t("chapter_generation.edit.submit")
            : t("chapter_generation.create.submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}
