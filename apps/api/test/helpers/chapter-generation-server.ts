export type ReceivedChapterGenerationRequest = {
  path: string
  authorization: string | null
  /** The JSON body of a chat completion request; null for other requests. */
  body: {
    model: string
    messages: { role: string; content: unknown }[]
    response_format?: unknown
  } | null
}

type ChapterGenerationAnswer = {
  status: number
  body: unknown
}

/**
 * A local server speaking OpenAI's chat completions API. It records each
 * request, and answers each completion with `answer`; `/models` answers
 * `modelsStatus`.
 */
export function startChapterGenerationServer() {
  const received: ReceivedChapterGenerationRequest[] = []
  const server = {
    answer: {
      status: 200,
      body: chatCompletionAnswer({
        chapters: [
          { startSeconds: 0, title: "Welcome" },
          { startSeconds: 30, title: "Getting started" },
        ],
      }),
    } as ChapterGenerationAnswer,
    modelsStatus: 200,
    received,
    baseUrl: "",
    stop: () => http.stop(true),
  }
  const http = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const path = new URL(request.url).pathname
      const authorization = request.headers.get("authorization")

      if (request.method === "GET" && path === "/v1/models") {
        received.push({ path, authorization, body: null })

        return Response.json({ data: [] }, { status: server.modelsStatus })
      }

      received.push({ path, authorization, body: await request.json() })

      return Response.json(server.answer.body, { status: server.answer.status })
    },
  })

  server.baseUrl = `http://127.0.0.1:${http.port}/v1`

  return server
}

/** A chat completion whose message is `content`, as JSON unless it is a string. */
export const chatCompletionAnswer = (content: unknown) => ({
  id: "chatcmpl-test",
  object: "chat.completion",
  created: 1_700_000_000,
  model: "gpt-6-luna",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content:
          typeof content === "string" ? content : JSON.stringify(content),
      },
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
})
