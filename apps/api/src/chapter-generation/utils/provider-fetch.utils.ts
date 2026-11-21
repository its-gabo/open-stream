import type { LookupFunction } from "node:net"
import { sendTranscriptionRequest } from "../../captions/utils/transcription-request.utils"
import { getErrorMessage } from "../../common/utils/error.utils"
import {
  CHAPTER_GENERATION_FAILURES,
  CHAPTER_GENERATION_RESPONSE_MAX_BYTES,
} from "../constants/chapter-generation.constants"
import { ChapterGenerationProviderError } from "../errors/chapter-generation-provider.error"

/** Statuses whose responses carry no body. */
const NULL_BODY_STATUSES = [204, 205, 304]

/**
 * A `fetch` for the AI SDK that sends each request the way transcription
 * providers are reached: no redirects followed, a size limit on the answer,
 * the whole exchange within `timeoutMs`, and the host resolved by `lookup`,
 * so its checks apply to the address actually connected to. `init.signal`
 * cancels it. A request that cannot be completed otherwise throws
 * `ChapterGenerationProviderError`.
 */
export const createProviderFetch = ({
  timeoutMs,
  lookup,
}: {
  timeoutMs: number
  lookup: LookupFunction | undefined
}): typeof fetch =>
  // Only the call signature is used by the AI SDK; `fetch.preconnect` is not.
  (async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString()
    const body =
      init?.body == null
        ? undefined
        : new Uint8Array(await new Response(init.body).arrayBuffer())

    let answer: { status: number; text: string }

    try {
      answer = await sendTranscriptionRequest(url, {
        method: init?.method ?? "GET",
        headers: Object.fromEntries(new Headers(init?.headers).entries()),
        body,
        timeoutMs,
        maxResponseBytes: CHAPTER_GENERATION_RESPONSE_MAX_BYTES,
        lookup,
        signal: init?.signal ?? undefined,
      })
    } catch (error) {
      // A canceled request stays an abort, as the AI SDK expects.
      if (init?.signal?.aborted) throw init.signal.reason

      throw new ChapterGenerationProviderError(
        `The provider could not be reached: ${getErrorMessage(error)}`,
        CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
      )
    }

    if (answer.status < 200 || answer.status > 599) {
      throw new ChapterGenerationProviderError(
        `The provider answered with status ${answer.status}`,
        CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
      )
    }

    return new Response(
      NULL_BODY_STATUSES.includes(answer.status) ? null : answer.text,
      {
        status: answer.status,
        headers: { "content-type": "application/json" },
      }
    )
  }) as typeof fetch
