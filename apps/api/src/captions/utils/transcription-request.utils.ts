import { request as requestHttp } from "node:http"
import { request as requestHttps } from "node:https"
import type { LookupFunction } from "node:net"

export class TranscriptionRequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`No answer within ${timeoutMs / 1000} seconds`)
    this.name = "TranscriptionRequestTimeoutError"
  }
}

export class TranscriptionResponseTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`The answer is larger than ${maxBytes} bytes`)
    this.name = "TranscriptionResponseTooLargeError"
  }
}

/**
 * Sends one request to a provider and reads its answer as text, without
 * following redirects. `lookup` resolves the host for the connection
 * itself, so its checks apply to the address actually used; the whole
 * exchange must finish within `timeoutMs`, and `signal` cancels it.
 */
export function sendTranscriptionRequest(
  url: string,
  {
    method,
    headers,
    body,
    timeoutMs,
    maxResponseBytes,
    lookup,
    signal,
  }: {
    method: string
    headers: Record<string, string>
    body?: Uint8Array
    timeoutMs: number
    maxResponseBytes: number
    lookup?: LookupFunction
    signal?: AbortSignal
  }
) {
  const request = url.startsWith("https:") ? requestHttps : requestHttp

  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)

      return
    }

    const outgoing = request(
      url,
      {
        method,
        headers: body
          ? { ...headers, "content-length": body.byteLength }
          : headers,
        lookup,
      },
      (response) => {
        const chunks: Buffer[] = []
        let receivedBytes = 0

        response.on("data", (chunk: Buffer) => {
          receivedBytes += chunk.byteLength

          if (receivedBytes > maxResponseBytes) {
            outgoing.destroy(
              new TranscriptionResponseTooLargeError(maxResponseBytes)
            )

            return
          }

          chunks.push(chunk)
        })
        response.on("end", () => {
          settle()
          resolve({
            status: response.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          })
        })
        response.on("error", (error) => {
          settle()
          reject(error)
        })
      }
    )
    const timer = setTimeout(
      () => outgoing.destroy(new TranscriptionRequestTimeoutError(timeoutMs)),
      timeoutMs
    )
    const settle = () => {
      clearTimeout(timer)
      signal?.removeEventListener("abort", abort)
    }

    function abort() {
      settle()
      outgoing.destroy()
      reject(signal?.reason)
    }

    signal?.addEventListener("abort", abort, { once: true })
    outgoing.on("error", (error) => {
      settle()
      reject(error)
    })
    outgoing.end(body)
  })
}

/** A form as the bytes and `content-type` of a `multipart/form-data` body. */
export async function encodeMultipartForm(form: FormData) {
  const encoded = new Response(form)
  // Read before the body: Bun drops a request's header once its body is read.
  const contentType = encoded.headers.get("content-type")!

  return { body: new Uint8Array(await encoded.arrayBuffer()), contentType }
}
