import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createTestConfig } from "../../../test/helpers/test-app"

import { CHAPTER_GENERATION_FAILURES } from "../constants/chapter-generation.constants"
import { ChapterGenerationProviderError } from "../errors/chapter-generation-provider.error"
import { AiSdkChapterGenerationClientService } from "../services/ai-sdk-chapter-generation-client.service"
import { buildChapterPrompt } from "../utils/chapter-prompt.utils"

const CHAPTERS = {
  chapters: [
    { startSeconds: 0, title: "Welcome" },
    { startSeconds: 40, title: "Setup" },
  ],
}

/** An answer of OpenAI's Responses API whose output text is `text`. */
const responsesAnswer = (text: string) => ({
  id: "resp_test",
  object: "response",
  created_at: 1_700_000_000,
  status: "completed",
  model: "gpt-5.5",
  output: [
    {
      type: "message",
      id: "msg_test",
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", text, annotations: [] }],
    },
  ],
  usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
})

describe("AiSdkChapterGenerationClientService", () => {
  let server: ReturnType<typeof Bun.serve>
  let received: { path: string; body: Record<string, unknown> }[]
  let answer: { status: number; body: unknown }
  let baseUrl: string
  const client = new AiSdkChapterGenerationClientService(createTestConfig())
  const prompt = buildChapterPrompt(
    [
      { startSeconds: 0, text: "Hello" },
      { startSeconds: 40, text: "Let's set things up" },
    ],
    90
  )

  beforeEach(() => {
    received = []
    answer = { status: 200, body: responsesAnswer(JSON.stringify(CHAPTERS)) }
    server = Bun.serve({
      port: 0,
      hostname: "127.0.0.1",
      async fetch(request) {
        received.push({
          path: new URL(request.url).pathname,
          body: (await request.json()) as Record<string, unknown>,
        })

        return Response.json(answer.body, { status: answer.status })
      },
    })
    baseUrl = `http://127.0.0.1:${server.port}/v1`
  })

  afterEach(() => server.stop(true))

  it("asks OpenAI for the provider's model's chapters through the Responses API, as structured output", async () => {
    const proposal = await client.proposeChapters(
      { kind: "openai", baseUrl, model: "gpt-5.5", apiKey: "sk-openai" },
      { prompt, maxOutputTokens: 16_000 }
    )
    const [request] = received

    expect(proposal).toEqual({ chapters: CHAPTERS.chapters, tokens: 120 })
    expect(request!.path).toBe("/v1/responses")
    expect(request!.body.model).toBe("gpt-5.5")
    expect(request!.body.max_output_tokens).toBe(16_000)
    expect(request!.body.text).toMatchObject({
      format: { type: "json_schema", name: "video_chapters" },
    })
    expect(JSON.stringify(request!.body.input)).toContain(
      "[40] Let's set things up"
    )
  })

  it("reports an answer that is not chapters in the shape asked for", async () => {
    answer = {
      status: 200,
      body: responsesAnswer(JSON.stringify({ sections: [] })),
    }

    const failure = await client
      .proposeChapters(
        { kind: "openai", baseUrl, model: "gpt-5.5", apiKey: "sk-openai" },
        { prompt, maxOutputTokens: 16_000 }
      )
      .catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ChapterGenerationProviderError)
    expect((failure as ChapterGenerationProviderError).failure).toBe(
      CHAPTER_GENERATION_FAILURES.INVALID_ANSWER
    )
  })

  it("cancels the request when its signal aborts", async () => {
    const controller = new AbortController()

    controller.abort()

    const failure = await client
      .proposeChapters(
        { kind: "openai", baseUrl, model: "gpt-5.5", apiKey: "sk-openai" },
        { prompt, maxOutputTokens: 16_000, abortSignal: controller.signal }
      )
      .catch((error: unknown) => error)

    expect((failure as ChapterGenerationProviderError).failure).toBe(
      CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
    )
    expect(received).toEqual([])
  })

  // Literal addresses are refused before the client, by `isEndpointAllowed`; a name is checked once it resolves.
  it("refuses a host that resolves to a private address unless the config allows it", async () => {
    const strictClient = new AiSdkChapterGenerationClientService(
      createTestConfig({ CHAPTER_GENERATION_ALLOW_PRIVATE_ENDPOINTS: "false" })
    )

    const failure = await strictClient
      .proposeChapters(
        {
          kind: "openai_compatible",
          baseUrl: `http://localhost:${server.port}/v1`,
          model: "llama-4",
          apiKey: null,
        },
        { prompt, maxOutputTokens: 16_000 }
      )
      .catch((error: unknown) => error)

    expect((failure as ChapterGenerationProviderError).failure).toBe(
      CHAPTER_GENERATION_FAILURES.PROVIDER_UNREACHABLE
    )
    expect(received).toEqual([])
  })
})
