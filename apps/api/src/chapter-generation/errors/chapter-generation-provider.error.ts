import type { ChapterGenerationFailure } from "../types/chapter-generation.types"

/** A provider failed, refused a request, or answered with nothing usable; `tokens` it still used, when it said. */
export class ChapterGenerationProviderError extends Error {
  constructor(
    message: string,
    readonly failure: ChapterGenerationFailure,
    readonly tokens: number | null = null
  ) {
    super(message)
    this.name = "ChapterGenerationProviderError"
  }
}
