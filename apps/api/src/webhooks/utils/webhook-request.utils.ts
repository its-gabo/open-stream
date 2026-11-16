import { request as requestHttp } from "node:http"
import { request as requestHttps } from "node:https"
import type { LookupFunction } from "node:net"

export class WebhookTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`No answer within ${timeoutMs} ms`)
    this.name = "WebhookTimeoutError"
  }
}

/**
 * POSTs `body` and resolves with the response status, without following
 * redirects or reading the response. `lookup` resolves the host for the
 * connection itself, so its checks apply to the address actually used.
 */
export function postWebhookRequest(
  url: string,
  {
    headers,
    body,
    timeoutMs,
    lookup,
  }: {
    headers: Record<string, string>
    body: string
    timeoutMs: number
    lookup?: LookupFunction
  }
) {
  const request = url.startsWith("https:") ? requestHttps : requestHttp

  return new Promise<number>((resolve, reject) => {
    const outgoing = request(
      url,
      {
        method: "POST",
        headers: { ...headers, "content-length": Buffer.byteLength(body) },
        lookup,
      },
      (response) => {
        clearTimeout(timer)
        response.resume()
        resolve(response.statusCode ?? 0)
      }
    )
    const timer = setTimeout(
      () => outgoing.destroy(new WebhookTimeoutError(timeoutMs)),
      timeoutMs
    )

    outgoing.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    outgoing.end(body)
  })
}
