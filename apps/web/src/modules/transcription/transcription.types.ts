import type { z } from "zod"

import type {
  libraryTranscriptionFormSchema,
  transcriptionProviderFormSchema,
} from "./transcription.schemas"

export type TranscriptionProviderFormValues = z.infer<
  ReturnType<typeof transcriptionProviderFormSchema>
>

export type LibraryTranscriptionFormValues = z.infer<
  ReturnType<typeof libraryTranscriptionFormSchema>
>
