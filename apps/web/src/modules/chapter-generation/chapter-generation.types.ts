import type { z } from "zod"

import type {
  chapterGenerationProviderFormSchema,
  libraryChapterGenerationFormSchema,
} from "./chapter-generation.schemas"

export type ChapterGenerationProviderFormValues = z.infer<
  ReturnType<typeof chapterGenerationProviderFormSchema>
>

export type LibraryChapterGenerationFormValues = z.infer<
  ReturnType<typeof libraryChapterGenerationFormSchema>
>
