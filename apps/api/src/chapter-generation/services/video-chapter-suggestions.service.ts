import { match } from "ts-pattern"
import type { ActivityActor } from "../../activity/types/activity.types"
import type { VideoCaptionsService } from "../../captions/services/video-captions.service"
import { DomainError } from "../../common/errors/domain-error"
import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import { CHAPTER_GENERATION_FAILURES } from "../constants/chapter-generation.constants"
import type { VideoChapterSuggestionRequestBody } from "../dto/chapter-generation.schemas"
import { ChapterGenerationProviderError } from "../errors/chapter-generation-provider.error"
import { CHAPTER_GENERATION_ERRORS } from "../errors/chapter-generation.errors"
import type { ChapterGenerationProvidersRepository } from "../repository/chapter-generation-providers.repository"
import type {
  ChapterGenerationClient,
  ChapterGenerationFailure,
  ChapterProposal,
  VideoChapterSuggestions,
} from "../types/chapter-generation.types"
import {
  buildChapterPrompt,
  estimatePromptTokens,
} from "../utils/chapter-prompt.utils"
import { toSuggestedChapters } from "../utils/chapter-suggestion.utils"
import { toTranscriptLines } from "../utils/chapter-transcript.utils"
import type { ChapterGenerationProvidersService } from "./chapter-generation-providers.service"

/**
 * Proposes chapters for a processed video from one of its caption tracks,
 * with the library's provider. Nothing is saved: the member reviews the
 * chapters and saves them like ones they typed.
 */
export class VideoChapterSuggestionsService {
  constructor(
    private readonly chapterGenerationProvidersRepository: ChapterGenerationProvidersRepository,
    private readonly chapterGenerationProvidersService: ChapterGenerationProvidersService,
    private readonly chapterGenerationClient: ChapterGenerationClient,
    private readonly videoCaptionsService: VideoCaptionsService,
    private readonly logger: Logger
  ) {}

  /**
   * Tokens for the request are reserved from the provider's monthly limit
   * before it is asked, and replaced by what it used once it answers: its
   * own count, or the reservation when it gives none. A failed request
   * counts only the tokens the provider says it used. `abortSignal`, e.g.
   * the member's connection closing, cancels the request to the provider.
   */
  async suggestChapters(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    { captionId }: VideoChapterSuggestionRequestBody,
    abortSignal?: AbortSignal
  ): Promise<VideoChapterSuggestions> {
    const provider =
      await this.chapterGenerationProvidersRepository.findLibraryProvider(
        library.id
      )

    if (!provider)
      throw new DomainError(CHAPTER_GENERATION_ERRORS.NOT_CONFIGURED)

    const { durationSeconds, cues } =
      await this.videoCaptionsService.readCaptionCues(library, {
        videoId,
        captionId,
      })
    const transcript = toTranscriptLines(cues ?? [])

    if (transcript.length === 0) {
      throw new DomainError(CHAPTER_GENERATION_ERRORS.NO_SPEECH)
    }

    const endpoint = this.chapterGenerationProvidersService.toEndpoint(provider)

    if (
      !this.chapterGenerationProvidersService.isEndpointAllowed(
        endpoint.baseUrl
      )
    ) {
      throw new DomainError(
        CHAPTER_GENERATION_ERRORS.PROVIDER_ENDPOINT_NOT_ALLOWED
      )
    }

    const prompt = buildChapterPrompt(transcript, durationSeconds)
    const inputTokens = estimatePromptTokens(prompt)
    const reservation =
      await this.chapterGenerationProvidersService.reserveTokens(provider, {
        videoId,
        requestedById: actor.userId,
        inputTokens,
      })
    let proposal: ChapterProposal

    try {
      proposal = await this.chapterGenerationClient.proposeChapters(endpoint, {
        prompt,
        maxOutputTokens: reservation.maxOutputTokens,
        abortSignal,
      })
    } catch (error) {
      if (!(error instanceof ChapterGenerationProviderError)) {
        await this.settleTokens(reservation.usageId, 0)

        throw error
      }

      await this.settleTokens(reservation.usageId, error.tokens ?? 0)
      this.logger.warn("A provider could not write a video's chapters", {
        videoId,
        providerId: provider.id,
        failure: error.failure,
        error: error.message,
      })

      throw new DomainError(toDomainError(error.failure))
    }

    // Without the provider's own count, the reservation is kept.
    await this.settleTokens(
      reservation.usageId,
      proposal.tokens ?? inputTokens + reservation.maxOutputTokens
    )

    const chapters = toSuggestedChapters(proposal.chapters, {
      durationSeconds,
      cueStarts: (cues ?? []).map(({ startSeconds }) => startSeconds),
    })

    if (chapters.length === 0) {
      this.logger.warn("A provider proposed no chapter within the video", {
        videoId,
        providerId: provider.id,
      })

      throw new DomainError(CHAPTER_GENERATION_ERRORS.INVALID_ANSWER)
    }

    return { chapters }
  }

  /**
   * Records what a request used. A failure here is logged rather than
   * thrown, so the member still gets the provider's answer; the
   * reservation then stops counting once its request would have timed out.
   */
  private async settleTokens(usageId: string, tokens: number) {
    try {
      await this.chapterGenerationProvidersService.settleTokens(usageId, tokens)
    } catch (error) {
      this.logger.error("Could not record the tokens a request used", {
        usageId,
        tokens,
        error: toError(error),
      })
    }
  }
}

const toDomainError = (failure: ChapterGenerationFailure) =>
  match(failure)
    .with(
      CHAPTER_GENERATION_FAILURES.PROVIDER_AUTH,
      () => CHAPTER_GENERATION_ERRORS.PROVIDER_AUTH_FAILED
    )
    .with(
      CHAPTER_GENERATION_FAILURES.PROVIDER_REJECTED,
      () => CHAPTER_GENERATION_ERRORS.PROVIDER_REJECTED
    )
    .with(
      CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE,
      () => CHAPTER_GENERATION_ERRORS.PROVIDER_UNAVAILABLE
    )
    .with(
      CHAPTER_GENERATION_FAILURES.INVALID_ANSWER,
      () => CHAPTER_GENERATION_ERRORS.INVALID_ANSWER
    )
    .exhaustive()
