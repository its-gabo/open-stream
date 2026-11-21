import {
  CHAPTER_GENERATION_PROVIDER_KINDS,
  CHAPTER_GENERATION_PROVIDER_LIMITS,
} from "@workspace/shared"
import { z } from "zod"

import { NO_CHAPTER_GENERATION_PROVIDER } from "./chapter-generation.constants"

import { parseUsageLimit } from "@/lib/usage-limit"

import type { TranslationFunction } from "@/i18n/i18n.types"
import type { ChapterGenerationProvider } from "@/api/generated-api"
import type { FormFieldSelectOption } from "@workspace/ui/lib/form-field.types"

/**
 * A provider as the form edits it. OpenAI needs a key when created; a
 * server of one's own needs its address. When editing, an empty key keeps
 * the saved one. The model is fixed, so it is not asked for.
 */
export const chapterGenerationProviderFormSchema = (
  t: TranslationFunction,
  { isEditing }: { isEditing: boolean }
) =>
  z
    .object({
      kind: z.enum(CHAPTER_GENERATION_PROVIDER_KINDS).meta({
        label: t("chapter_generation.fields.kind"),
        type: "select",
        options: Object.values(CHAPTER_GENERATION_PROVIDER_KINDS).map(
          (kind) => ({
            value: kind,
            label: t(`chapter_generation.kinds.${kind}.label`),
          })
        ),
      }),
      name: z
        .string()
        .trim()
        .min(1, t("validation.chapter_generation_provider.name"))
        .max(CHAPTER_GENERATION_PROVIDER_LIMITS.NAME_MAX_LENGTH)
        .meta({
          label: t("chapter_generation.fields.name"),
          placeholder: t("chapter_generation.fields.name_placeholder"),
          type: "text",
          autoComplete: "off",
        }),
      baseUrl: z
        .string()
        .trim()
        .max(CHAPTER_GENERATION_PROVIDER_LIMITS.BASE_URL_MAX_LENGTH)
        .meta({
          label: t("chapter_generation.fields.base_url"),
          placeholder: "https://llm.example.com/v1",
          type: "text",
          autoComplete: "off",
        }),
      apiKey: z
        .string()
        .trim()
        .max(CHAPTER_GENERATION_PROVIDER_LIMITS.API_KEY_MAX_LENGTH)
        .meta({
          label: t("chapter_generation.fields.api_key"),
          placeholder: isEditing
            ? t("chapter_generation.fields.api_key_keep")
            : "sk-…",
          type: "password",
          autoComplete: "off",
        }),
      monthlyTokenLimit: z
        .string()
        .refine(
          (value) =>
            !Number.isNaN(
              parseUsageLimit(
                value,
                CHAPTER_GENERATION_PROVIDER_LIMITS.MONTHLY_TOKEN_LIMIT_MAX
              )
            ),
          t("validation.chapter_generation_provider.monthly_token_limit")
        )
        .meta({
          label: t("chapter_generation.fields.monthly_token_limit"),
          placeholder: t("chapter_generation.fields.no_limit"),
          type: "text",
          autoComplete: "off",
        }),
    })
    .superRefine((values, context) => {
      if (
        values.kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE &&
        !z.url({ protocol: /^https?$/ }).safeParse(values.baseUrl).success
      ) {
        context.addIssue({
          code: "custom",
          path: ["baseUrl"],
          message: t("validation.chapter_generation_provider.base_url"),
        })
      }

      if (
        values.kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI &&
        !isEditing &&
        !values.apiKey
      ) {
        context.addIssue({
          code: "custom",
          path: ["apiKey"],
          message: t("validation.chapter_generation_provider.api_key"),
        })
      }
    })

/** The library's provider, or `NO_CHAPTER_GENERATION_PROVIDER`. */
export const libraryChapterGenerationFormSchema = (
  t: TranslationFunction,
  { providerOptions }: { providerOptions: FormFieldSelectOption[] }
) =>
  z.object({
    providerId: z.string().meta({
      label: t("libraries.chapter_generation.fields.provider"),
      type: "select",
      options: [
        {
          value: NO_CHAPTER_GENERATION_PROVIDER,
          label: t("libraries.chapter_generation.fields.no_provider"),
        },
        ...providerOptions,
      ],
    }),
  })

export const toChapterGenerationProviderOptions = (
  providers: ChapterGenerationProvider[]
) => providers.map(({ id, name }) => ({ value: id, label: name }))
