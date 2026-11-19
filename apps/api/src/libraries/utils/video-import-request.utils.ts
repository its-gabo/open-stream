import { request as requestHttp, type IncomingMessage } from "node:http"
import { request as requestHttps } from "node:https"
import type { LookupFunction } from "node:net"
import {
  VIDEO_IMPORT_IDLE_TIMEOUT_MS,
  VIDEO_IMPORT_MAX_REDIRECTS,
  VIDEO_IMPORT_USER_AGENT,
} from "../constants/video-import.constants"
import {
  type VideoImportError,
  createImportTimedOutError,
  createImportUnreachableError,
  toImportRequestError,
} from "../errors/video-import.error"
import type {
  ImportDownload,
  ImportDownloadOptions,
  ImportHttpResponse,
} from "../types/libraries.types"

/** Server errors, timeouts and rate limits can pass; other answers will not change. */
const isRetryableHttpStatus = (status: number) =>
  status >= 500 || status === 408 || status === 429

const parseContentLength = (value: string | undefined) => {
  const length = Number(value)

  return value && Number.isSafeInteger(length) && length >= 0 ? length : null
}

/**
 * GETs the file at `url`, following redirects. Every URL on the way must
 * pass `isAllowedUrl`, and `lookup` resolves the host of each connection,
 * so its checks apply to the address actually used. The whole download must
 * end within `timeoutMs`, and stops once no bytes arrive for a while.
 */
export async function openImportDownload(
  url: string,
  { isAllowedUrl, lookup, timeoutMs }: ImportDownloadOptions
): Promise<ImportDownload> {
  const deadline = Date.now() + timeoutMs
  let currentUrl = url

  for (let redirects = 0; ; redirects += 1) {
    if (!isAllowedUrl(currentUrl)) {
      throw createImportUnreachableError(
        "The URL is not a public HTTP or HTTPS address",
        true
      )
    }

    const response = await sendImportRequest(currentUrl, lookup, deadline)
    const status = response.message.statusCode ?? 0
    const location = response.message.headers.location

    if (status >= 300 && status < 400 && location) {
      response.cancel()

      if (redirects >= VIDEO_IMPORT_MAX_REDIRECTS) {
        throw createImportUnreachableError(
          "The URL redirected too many times",
          true
        )
      }

      const nextUrl = URL.parse(location, currentUrl)

      if (!nextUrl)
        throw createImportUnreachableError(
          "The URL redirected to an invalid URL",
          true
        )

      currentUrl = nextUrl.toString()
      continue
    }

    if (status < 200 || status >= 300) {
      response.cancel()

      throw createImportUnreachableError(
        `The server answered ${status}`,
        !isRetryableHttpStatus(status)
      )
    }

    return {
      contentLength: parseContentLength(
        response.message.headers["content-length"]
      ),
      chunks: response.chunks,
      cancel: response.cancel,
    }
  }
}

function sendImportRequest(
  url: string,
  lookup: LookupFunction | undefined,
  deadline: number
) {
  const request = url.startsWith("https:") ? requestHttps : requestHttp

  return new Promise<ImportHttpResponse>((resolve, reject) => {
    let incoming: IncomingMessage | null = null
    let failure: VideoImportError | null = null
    let rejectStopped: (error: VideoImportError) => void = () => {}
    // Rejects once a timeout stops the download; a destroyed stream may
    // neither end nor fail, so each read races it.
    const stopped = new Promise<never>((_, rejectPromise) => {
      rejectStopped = rejectPromise
    })

    stopped.catch(() => {})

    const stop = (error?: VideoImportError) => {
      clearTimeout(deadlineTimer)
      incoming?.destroy()
      outgoing.destroy()

      if (!error || failure) return

      failure = error
      rejectStopped(error)
      reject(error)
    }

    /**
     * The reader is taken as soon as the response arrives, as a stream that
     * fails before anyone reads it drops what it received. A body cut short
     * ends some streams without an error, so how it ended is checked too.
     */
    async function* readBody(
      message: IncomingMessage,
      reader: AsyncIterator<unknown>
    ) {
      try {
        while (true) {
          const next = await Promise.race([reader.next(), stopped])

          if (next.done) break

          yield next.value as Uint8Array
        }
      } catch (error) {
        throw toImportRequestError(failure ?? error)
      } finally {
        stop()
      }

      if (failure) throw failure
      if (!message.complete) {
        throw createImportUnreachableError(
          "The connection closed before the whole file arrived",
          false
        )
      }
    }

    const outgoing = request(
      url,
      {
        method: "GET",
        headers: {
          "user-agent": VIDEO_IMPORT_USER_AGENT,
          "accept-encoding": "identity",
        },
        lookup,
      },
      (message) => {
        incoming = message
        resolve({
          message,
          chunks: readBody(message, message[Symbol.asyncIterator]()),
          cancel: () => stop(),
        })
      }
    )
    const deadlineTimer = setTimeout(
      () =>
        stop(createImportTimedOutError("The download did not finish in time")),
      Math.max(deadline - Date.now(), 0)
    )

    outgoing.setTimeout(VIDEO_IMPORT_IDLE_TIMEOUT_MS, () =>
      stop(
        createImportTimedOutError(
          `No data arrived for ${VIDEO_IMPORT_IDLE_TIMEOUT_MS / 1000} seconds`
        )
      )
    )
    outgoing.on("error", (error) => {
      clearTimeout(deadlineTimer)
      reject(toImportRequestError(failure ?? error))
    })
    outgoing.end()
  })
}

/** Joins the downloaded chunks into parts of `partSize` bytes; only the last part may be shorter. */
export async function* splitIntoParts(
  chunks: AsyncIterable<Uint8Array>,
  partSize: number
) {
  let pending: Uint8Array[] = []
  let pendingBytes = 0

  for await (const chunk of chunks) {
    pending.push(chunk)
    pendingBytes += chunk.byteLength

    while (pendingBytes >= partSize) {
      const joined = Buffer.concat(pending, pendingBytes)
      const rest = joined.subarray(partSize)

      yield joined.subarray(0, partSize)
      pending = rest.byteLength > 0 ? [rest] : []
      pendingBytes = rest.byteLength
    }
  }

  if (pendingBytes > 0) yield Buffer.concat(pending, pendingBytes)
}
