import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import {
  OPENAI_TRANSCRIPTION_DEFAULTS,
  TRANSCRIPTION_PROVIDER_KINDS,
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

import { transcriptionProviderFormSchema } from "../transcription.schemas"

import type { TranscriptionProvider } from "@/api/generated-api"
import type { TranscriptionProviderFormValues } from "../transcription.types"
import type { TranscriptionProviderSave } from "@/api/mutations/transcription/useTranscriptionProviderSaveMutation"

import { useTranscriptionProviderSaveMutation } from "@/api/mutations/transcription/useTranscriptionProviderSaveMutation"
import { getFormFields } from "@/lib/get-form-fields"

type TranscriptionProviderFormDialogProps = {
  organizationSlug: string
  /** The provider to edit; a new one is created without it. */
  provider: TranscriptionProvider | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Connects OpenAI or a server of one's own, or edits a provider; the form is reset each time the dialog opens. */
export function TranscriptionProviderFormDialog({
  organizationSlug,
  provider,
  open,
  onOpenChange,
}: TranscriptionProviderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && (
          <TranscriptionProviderForm
            organizationSlug={organizationSlug}
            provider={provider}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type TranscriptionProviderFormProps = {
  organizationSlug: string
  provider: TranscriptionProvider | null
  onSaved: () => void
}

function TranscriptionProviderForm({
  organizationSlug,
  provider,
  onSaved,
}: TranscriptionProviderFormProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(provider)
  const schema = transcriptionProviderFormSchema(t, { isEditing })
  const form = useForm<TranscriptionProviderFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      kind: provider?.kind ?? TRANSCRIPTION_PROVIDER_KINDS.OPENAI,
      name: provider?.name ?? "",
      baseUrl:
        provider?.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE
          ? provider.baseUrl
          : "",
      model: provider?.model ?? OPENAI_TRANSCRIPTION_DEFAULTS.MODEL,
      apiKey: "",
    },
  })
  const kind = useWatch({ control: form.control, name: "kind" })
  const baseUrl = useWatch({ control: form.control, name: "baseUrl" })
  // The API drops a saved key when the address changes, so it never reaches another server.
  const isSavedKeyDropped =
    provider?.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE &&
    provider.apiKeyHint !== null &&
    baseUrl.trim() !== provider.baseUrl
  const { mutate: saveProvider, isPending } =
    useTranscriptionProviderSaveMutation(organizationSlug, {
      onSuccess: onSaved,
    })
  // The kind is chosen once; a server of one's own also needs its address.
  const fields = getFormFields(schema).filter(({ name }) =>
    match(name)
      .with("kind", () => !isEditing)
      .with(
        "baseUrl",
        () => kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE
      )
      .otherwise(() => true)
  )

  const toSave = (
    values: TranscriptionProviderFormValues
  ): TranscriptionProviderSave => {
    const apiKey = values.apiKey || null

    if (provider) {
      return {
        providerId: provider.id,
        payload: {
          name: values.name,
          model: values.model,
          baseUrl:
            provider.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE
              ? values.baseUrl
              : null,
          ...(apiKey && { apiKey }),
        },
      }
    }

    return {
      providerId: null,
      payload: match(values.kind)
        .with(TRANSCRIPTION_PROVIDER_KINDS.OPENAI, (openAi) => ({
          kind: openAi,
          name: values.name,
          model: values.model,
          apiKey: apiKey ?? "",
        }))
        .with(TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE, (compatible) => ({
          kind: compatible,
          name: values.name,
          baseUrl: values.baseUrl,
          model: values.model,
          apiKey,
        }))
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
            ? t("transcription.edit.title")
            : t("transcription.create.title")}
        </DialogTitle>
        <DialogDescription>
          {t(`transcription.kinds.${kind}.description`)}
        </DialogDescription>
      </DialogHeader>
      <FormFieldRenderer
        control={form.control}
        errors={form.formState.errors}
        fields={fields}
      />
      <p className="text-xs text-muted-foreground">
        {kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI
          ? t("transcription.hints.openai")
          : t("transcription.hints.openai_compatible")}
      </p>
      {isSavedKeyDropped && (
        <p className="text-xs text-destructive">
          {t("transcription.hints.address_changed")}
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
            ? t("transcription.edit.submit")
            : t("transcription.create.submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}
