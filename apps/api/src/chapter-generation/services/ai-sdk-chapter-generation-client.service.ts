import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { CHAPTER_GENERATION_PROVIDER_KINDS } from "@workspace/shared"
import {
  APICallError,
  NoObjectGeneratedError,
  Output,
  generateText,
  type LanguageModel,
  type LanguageModelUsage,
} from "ai"
import { match } from "ts-pattern"
import { z } from "zod"
import { lookupPublicAddress } from "../../common/network/public-address-lookup.utils"
import type { AppConfig } from "../../config/app.config"
import {
  CHAPTER_GENERATION_CONNECTION_TEST_TIMEOUT_MS,
  CHAPTER_GENERATION_FAILURES,
  CHAPTER_GENERATION_INSTRUCTIONS,
  CHAPTER_GENERATION_USER_AGENT,
} from "../constants/chapter-generation.constants"
import { ChapterGenerationProviderError } from "../errors/chapter-generation-provider.error"
import type {
  ChapterGenerationClient,
  ChapterGenerationEndpoint,
  ChapterProposal,
} from "../types/chapter-generation.types"
import { createProviderFetch } from "../utils/provider-fetch.utils"

/** The structured answer the model must give; the API checks it against the video afterwards. */
const proposedChaptersSchema = z.object({
  chapters: z.array(
    z.object({
      startSeconds: z
        .number()
        .describe("Second of the transcript line where the chapter begins"),
      title: z.string().describe("Short title of the chapter"),
    })
  ),
})

const AUTH_FAILURE_STATUSES = [401, 403]
/** The provider will refuse the same request again, e.g. an unknown model. */
const REJECTED_STATUSES = [400, 404, 405, 413, 415, 422]

/**
 * Asks OpenAI, or a server speaking OpenAI's chat completions API, for a
 * video's chapters with the AI SDK, as structured output. OpenAI is asked
 * through its Responses API. Redirects are not followed, and unless the
 * config allows private endpoints, a host resolving to a private address
 * is refused at connection time.
 */
export class AiSdkChapterGenerationClientService implements ChapterGenerationClient {
  constructor(private readonly config: AppConfig) {}

  async proposeChapters(
    endpoint: ChapterGenerationEndpoint,
    {
      prompt,
      maxOutputTokens,
      abortSignal,
    }: { prompt: string; maxOutputTokens: number; abortSignal?: AbortSignal }
  ): Promise<ChapterProposal> {
    try {
      const { output, usage } = await generateText({
        model: this.toLanguageModel(endpoint),
        instructions: CHAPTER_GENERATION_INSTRUCTIONS,
        prompt,
        output: Output.object({
          schema: proposedChaptersSchema,
          name: "video_chapters",
          description: "The video's chapters in playback order",
        }),
        maxOutputTokens,
        abortSignal,
        headers: { "user-agent": CHAPTER_GENERATION_USER_AGENT },
        maxRetries: 0,
      })

      return { chapters: output.chapters, tokens: toTokens(usage) }
    } catch (error) {
      throw toProviderError(error)
    }
  }

  /** Lists the provider's models, which needs the key but costs nothing. */
  async testConnection(endpoint: ChapterGenerationEndpoint) {
    const fetchFromProvider = createProviderFetch({
      timeoutMs: CHAPTER_GENERATION_CONNECTION_TEST_TIMEOUT_MS,
      lookup: this.lookup(),
    })

    try {
      const { status } = await fetchFromProvider(`${endpoint.baseUrl}/models`, {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": CHAPTER_GENERATION_USER_AGENT,
          ...(endpoint.apiKey && {
            authorization: `Bearer ${endpoint.apiKey}`,
          }),
        },
      })

      return {
        isReachable: true,
        isAuthorized: !AUTH_FAILURE_STATUSES.includes(status),
      }
    } catch {
      return { isReachable: false, isAuthorized: false }
    }
  }

  private toLanguageModel(endpoint: ChapterGenerationEndpoint): LanguageModel {
    const fetchFromProvider = createProviderFetch({
      timeoutMs: this.config.CHAPTER_GENERATION_REQUEST_TIMEOUT_MS,
      lookup: this.lookup(),
    })

    return match(endpoint.kind)
      .with(CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI, () =>
        createOpenAI({
          baseURL: endpoint.baseUrl,
          apiKey: endpoint.apiKey ?? "",
          fetch: fetchFromProvider,
        }).responses(endpoint.model)
      )
      .with(CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE, () =>
        createOpenAICompatible({
          name: "openai-compatible",
          baseURL: endpoint.baseUrl,
          apiKey: endpoint.apiKey ?? undefined,
          fetch: fetchFromProvider,
          supportsStructuredOutputs: true,
        }).chatModel(endpoint.model)
      )
      .exhaustive()
  }

  private lookup() {
    return this.config.CHAPTER_GENERATION_ALLOW_PRIVATE_ENDPOINTS
      ? undefined
      : lookupPublicAddress
  }
}

/** Tokens read and written as the provider counted them; null when it did not say. */
function toTokens({
  inputTokens,
  outputTokens,
  totalTokens,
}: LanguageModelUsage) {
  if (totalTokens !== undefined) return totalTokens
  if (inputTokens === undefined && outputTokens === undefined) return null

  return (inputTokens ?? 0) + (outputTokens ?? 0)
}

/** What an AI SDK failure means for the member waiting on chapters. */
function toProviderError(error: unknown) {
  if (error instanceof ChapterGenerationProviderError) return error

  if (error instanceof Error && error.name === "AbortError") {
    return new ChapterGenerationProviderError(
      "The request was canceled",
      CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
    )
  }

  if (APICallError.isInstance(error)) {
    const status = error.statusCode

    if (status === undefined) {
      return new ChapterGenerationProviderError(
        `The provider could not be reached: ${error.message}`,
        CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
      )
    }

    if (AUTH_FAILURE_STATUSES.includes(status)) {
      return new ChapterGenerationProviderError(
        `The provider refused the API key (${status})`,
        CHAPTER_GENERATION_FAILURES.PROVIDER_AUTH
      )
    }

    if (REJECTED_STATUSES.includes(status) || (status >= 300 && status < 400)) {
      return new ChapterGenerationProviderError(
        `The provider refused the request (${status})`,
        CHAPTER_GENERATION_FAILURES.PROVIDER_REJECTED
      )
    }

    return new ChapterGenerationProviderError(
      `The provider answered ${status}`,
      CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
    )
  }

  if (NoObjectGeneratedError.isInstance(error)) {
    return new ChapterGenerationProviderError(
      "The provider's answer is not chapters in the shape asked for",
      CHAPTER_GENERATION_FAILURES.INVALID_ANSWER,
      error.usage ? toTokens(error.usage) : null
    )
  }

  return new ChapterGenerationProviderError(
    "The provider's answer could not be read",
    CHAPTER_GENERATION_FAILURES.INVALID_ANSWER
  )
}
