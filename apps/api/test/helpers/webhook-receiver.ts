export type ReceivedWebhook = {
  headers: Record<string, string>
  body: string
}

/**
 * A local HTTP endpoint that records the webhooks it receives and answers
 * with `status`, which tests may change between deliveries.
 */
export function startWebhookReceiver() {
  const received: ReceivedWebhook[] = []
  const receiver = {
    status: 200,
    received,
    url: "",
    stop: () => server.stop(true),
  }
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      received.push({
        headers: Object.fromEntries(request.headers),
        body: await request.text(),
      })

      return new Response(null, {
        status: receiver.status,
        headers:
          receiver.status >= 300 && receiver.status < 400
            ? { location: "https://example.com/" }
            : {},
      })
    },
  })

  receiver.url = `http://127.0.0.1:${server.port}/hooks`

  return receiver
}
