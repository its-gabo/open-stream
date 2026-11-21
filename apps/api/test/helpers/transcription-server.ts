export type ReceivedTranscriptionRequest = {
  path: string
  authorization: string | null
  /** The form fields sent with an audio file, without the file itself. */
  fields: Record<string, string>
  fileName: string | null
}

type TranscriptionAnswer = {
  status: number
  body: unknown
}

/**
 * A local server speaking OpenAI's transcription API. It records each
 * request, and answers each audio file with the next of `answers`, or the
 * last one once they run out; `/models` answers `modelsStatus`.
 */
export function startTranscriptionServer() {
  const received: ReceivedTranscriptionRequest[] = []
  const server = {
    answers: [
      {
        status: 200,
        body: transcriptAnswer("english", [
          { start: 0, end: 1.5, text: " Hello there." },
        ]),
      },
    ] as TranscriptionAnswer[],
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
        received.push({ path, authorization, fields: {}, fileName: null })

        return Response.json({ data: [] }, { status: server.modelsStatus })
      }

      const form = await request.formData()
      const file = form.get("file")
      const fields = Object.fromEntries(
        [...form.entries()]
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => [key, String(value)])
      )

      received.push({
        path,
        authorization,
        fields,
        fileName: file instanceof File ? file.name : null,
      })

      const audioRequests = received.filter(
        ({ fileName }) => fileName !== null
      ).length
      const answer =
        server.answers[Math.min(audioRequests, server.answers.length) - 1]!

      return Response.json(answer.body, { status: answer.status })
    },
  })

  server.baseUrl = `http://127.0.0.1:${http.port}/v1`

  return server
}

/** An answer as OpenAI's `verbose_json` gives it. */
export const transcriptAnswer = (
  language: string,
  segments: { start: number; end: number; text: string }[]
) => ({
  task: "transcribe",
  language,
  duration: segments.at(-1)?.end ?? 0,
  text: segments.map(({ text }) => text).join(""),
  segments: segments.map((segment, id) => ({ id, ...segment })),
})
