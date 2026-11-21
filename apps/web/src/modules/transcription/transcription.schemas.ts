import {
  OPENAI_TRANSCRIPTION_DEFAULTS,
  TRANSCRIPTION_PROVIDER_KINDS,
  TRANSCRIPTION_PROVIDER_LIMITS,
} from "@workspace/shared"
import { z } from "zod"

import { NO_TRANSCRIPTION_PROVIDER } from "./transcription.constants"

import type { TranslationFunction } from "@/i18n/i18n.types"
import type { TranscriptionProvider } from "@/api/generated-api"
import type { FormFieldSelectOption } from "@workspace/ui/lib/form-field.types"

/**
 * A provider as the form edits it. OpenAI needs a key when created; a
 * server of one's own needs its address. When editing, an empty key keeps
 * the saved one.
 */
export const transcriptionProviderFormSchema = (
  t: TranslationFunction,
  { isEditing }: { isEditing: boolean }
) =>
  z
    .object({
      kind: z.enum(TRANSCRIPTION_PROVIDER_KINDS).meta({
        label: t("transcription.fields.kind"),
        type: "select",
        options: Object.values(TRANSCRIPTION_PROVIDER_KINDS).map((kind) => ({
          value: kind,
          label: t(`transcription.kinds.${kind}.label`),
        })),
      }),
      name: z
        .string()
        .trim()
        .min(1, t("validation.transcription_provider.name"))
        .max(TRANSCRIPTION_PROVIDER_LIMITS.NAME_MAX_LENGTH)
        .meta({
          label: t("transcription.fields.name"),
          placeholder: t("transcription.fields.name_placeholder"),
          type: "text",
          autoComplete: "off",
        }),
      baseUrl: z
        .string()
        .trim()
        .max(TRANSCRIPTION_PROVIDER_LIMITS.BASE_URL_MAX_LENGTH)
        .meta({
          label: t("transcription.fields.base_url"),
          placeholder: "https://whisper.example.com/v1",
          type: "text",
          autoComplete: "off",
        }),
      model: z
        .string()
        .trim()
        .min(1, t("validation.transcription_provider.model"))
        .max(TRANSCRIPTION_PROVIDER_LIMITS.MODEL_MAX_LENGTH)
        .meta({
          label: t("transcription.fields.model"),
          placeholder: OPENAI_TRANSCRIPTION_DEFAULTS.MODEL,
          type: "text",
          autoComplete: "off",
        }),
      apiKey: z
        .string()
        .trim()
        .max(TRANSCRIPTION_PROVIDER_LIMITS.API_KEY_MAX_LENGTH)
        .meta({
          label: t("transcription.fields.api_key"),
          placeholder: isEditing
            ? t("transcription.fields.api_key_keep")
            : "sk-…",
          type: "password",
          autoComplete: "off",
        }),
    })
    .superRefine((values, context) => {
      if (
        values.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE &&
        !z.url({ protocol: /^https?$/ }).safeParse(values.baseUrl).success
      ) {
        context.addIssue({
          code: "custom",
          path: ["baseUrl"],
          message: t("validation.transcription_provider.base_url"),
        })
      }

      if (
        values.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI &&
        !isEditing &&
        !values.apiKey
      ) {
        context.addIssue({
          code: "custom",
          path: ["apiKey"],
          message: t("validation.transcription_provider.api_key"),
        })
      }
    })

/** The library's provider, or `NO_TRANSCRIPTION_PROVIDER`, and how its videos are transcribed. */
export const libraryTranscriptionFormSchema = (
  t: TranslationFunction,
  { providerOptions }: { providerOptions: FormFieldSelectOption[] }
) =>
  z
    .object({
      providerId: z.string().meta({
        label: t("libraries.transcription.fields.provider"),
        type: "select",
        options: [
          {
            value: NO_TRANSCRIPTION_PROVIDER,
            label: t("libraries.transcription.fields.no_provider"),
          },
          ...providerOptions,
        ],
      }),
      language: z.string(),
      autoTranscribe: z.boolean(),
    })
    .refine(
      ({ providerId, autoTranscribe }) =>
        !autoTranscribe || providerId !== NO_TRANSCRIPTION_PROVIDER,
      {
        path: ["autoTranscribe"],
        message: t("validation.transcription_provider.auto_needs_provider"),
      }
    )

export const toProviderOptions = (providers: TranscriptionProvider[]) =>
  providers.map(({ id, name, model }) => ({
    value: id,
    label: `${name} · ${model}`,
  }))
