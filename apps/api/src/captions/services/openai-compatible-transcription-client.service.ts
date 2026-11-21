import { z } from "zod"
import { VIDEO_TRANSCRIPTION_FAILURE_REASONS } from "@workspace/shared"
import { getErrorMessage } from "../../common/utils/error.utils"
import {
  PrivateAddressError,
  lookupPublicAddress,
} from "../../common/network/public-address-lookup.utils"
import type { AppConfig } from "../../config/app.config"
import {
  TRANSCRIPTION_AUDIO_CONTENT_TYPE,
  TRANSCRIPTION_CONNECTION_TEST_TIMEOUT_MS,
  TRANSCRIPTION_RESPONSE_MAX_BYTES,
  TRANSCRIPTION_USER_AGENT,
} from "../constants/captions.constants"
import { TranscriptionProviderError } from "../errors/transcription-provider.error"
import type {
  Transcript,
  TranscriptionAudioFile,
  TranscriptionClient,
  TranscriptionEndpoint,
} from "../types/captions.types"
import {
  encodeMultipartForm,
  sendTranscriptionRequest,
} from "../utils/transcription-request.utils"

/** OpenAI's `verbose_json`, which Whisper servers compatible with it answer too. */
const verboseTranscriptSchema = z.object({
  language: z.string().nullish(),
  segments: z
    .array(
      z.object({
        start: z.number().nonnegative(),
        end: z.number().nonnegative(),
        text: z.string(),
      })
    )
    .nullish(),
})

const AUTH_FAILURE_STATUSES = [401, 403]
/** The provider will refuse the same request again, e.g. an unknown model or a file it cannot read. */
const REJECTED_STATUSES = [400, 404, 405, 413, 415, 422]

/**
 * Talks to OpenAI's audio API, or a server offering the same one: posts a
 * chunk of audio to `<baseUrl>/audio/transcriptions` and asks for segments
 * with their timings. Redirects are not followed, and unless the config
 * allows private endpoints, a host resolving to a private address is
 * refused at connection time.
 */
export class OpenAiCompatibleTranscriptionClientService implements TranscriptionClient {
  constructor(private readonly config: AppConfig) {}

  async transcribeAudio(
    endpoint: TranscriptionEndpoint,
    audio: TranscriptionAudioFile,
    { language }: { language: string | null }
  ): Promise<Transcript> {
    const form = new FormData()

    form.append(
      "file",
      new File([await Bun.file(audio.path).bytes()], audio.fileName, {
        type: TRANSCRIPTION_AUDIO_CONTENT_TYPE,
      })
    )
    form.append("model", endpoint.model)
    form.append("response_format", "verbose_json")
    form.append("timestamp_granularities[]", "segment")

    if (language) form.append("language", language)

    const { body, contentType } = await encodeMultipartForm(form)
    const response = await this.send(endpoint, "audio/transcriptions", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
      timeoutMs: this.config.TRANSCRIPTION_REQUEST_TIMEOUT_MS,
    })

    this.assertAccepted(response.status)

    const parsed = verboseTranscriptSchema.safeParse(parseJson(response.text))

    if (!parsed.success) {
      throw new TranscriptionProviderError(
        "The provider's answer has no segments with timings",
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_REJECTED,
        true
      )
    }

    return {
      language: parsed.data.language ?? null,
      segments: (parsed.data.segments ?? []).map(({ start, end, text }) => ({
        startSeconds: start,
        endSeconds: end,
        text,
      })),
    }
  }

  /** Lists the provider's models, which needs the key but costs nothing. */
  async testConnection(endpoint: TranscriptionEndpoint) {
    try {
      const { status } = await this.send(endpoint, "models", {
        method: "GET",
        headers: {},
        timeoutMs: TRANSCRIPTION_CONNECTION_TEST_TIMEOUT_MS,
      })

      return {
        isReachable: true,
        isAuthorized: !AUTH_FAILURE_STATUSES.includes(status),
      }
    } catch {
      return { isReachable: false, isAuthorized: false }
    }
  }

  private async send(
    endpoint: TranscriptionEndpoint,
    path: string,
    request: {
      method: "GET" | "POST"
      headers: Record<string, string>
      body?: Uint8Array
      timeoutMs: number
    }
  ) {
    try {
      return await sendTranscriptionRequest(`${endpoint.baseUrl}/${path}`, {
        ...request,
        headers: {
          ...request.headers,
          accept: "application/json",
          "user-agent": TRANSCRIPTION_USER_AGENT,
          ...(endpoint.apiKey && {
            authorization: `Bearer ${endpoint.apiKey}`,
          }),
        },
        maxResponseBytes: TRANSCRIPTION_RESPONSE_MAX_BYTES,
        // The host may point at a private address even when its name does
        // not look like it, so the address the request connects to is checked.
        lookup: this.config.TRANSCRIPTION_ALLOW_PRIVATE_ENDPOINTS
          ? undefined
          : lookupPublicAddress,
      })
    } catch (error) {
      throw new TranscriptionProviderError(
        `The provider could not be reached: ${getErrorMessage(error)}`,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_UNREACHABLE,
        error instanceof PrivateAddressError
      )
    }
  }

  private assertAccepted(status: number) {
    if (status >= 200 && status < 300) return

    if (AUTH_FAILURE_STATUSES.includes(status)) {
      throw new TranscriptionProviderError(
        `The provider refused the API key (${status})`,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_AUTH,
        true
      )
    }

    if (REJECTED_STATUSES.includes(status) || (status >= 300 && status < 400)) {
      throw new TranscriptionProviderError(
        `The provider refused the request (${status})`,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_REJECTED,
        true
      )
    }

    throw new TranscriptionProviderError(
      `The provider answered ${status}`,
      VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_UNREACHABLE,
      false
    )
  }
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
