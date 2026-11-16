import { afterEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient, signInAsUser } from "../../../test/helpers/api-client"
import { createLogCapture } from "../../../test/helpers/log-capture"
import {
  HAS_FFMPEG,
  createTestMediaFile,
} from "../../../test/helpers/media-files"
import { findVideoProcessingRequests } from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"

import type { TestApp } from "../../../test/helpers/test-app"

describe("Logging (e2e)", () => {
  let testApp: TestApp

  afterEach(() => testApp.close())

  const startApp = async (config: Record<string, string>) => {
    const logs = createLogCapture()

    testApp = await createTestApp(config, { logSink: logs.sink })

    return logs
  }

  it("logs each request with its status and duration, but never its query", async () => {
    const logs = await startApp({ LOG_LEVEL: "info", LOG_FORMAT: "pretty" })
    const client = createApiClient(testApp)

    await client.get("/auth/session")
    await client.get("/auth/verify-email?token=very-secret-token")
    await client.get("/no-such-route")

    expect(
      logs.linesWith("INFO", "http", "GET /api/v1/auth/session", "status=200")
    ).toHaveLength(1)
    expect(
      logs.linesWith("WARN", "GET /api/v1/auth/verify-email", "status=422")
    ).toHaveLength(1)
    expect(
      logs.linesWith("WARN", "GET /api/v1/no-such-route", "status=404")
    ).toHaveLength(1)
    expect(logs.lines.join("\n")).not.toContain("very-secret-token")
    expect(logs.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3} INFO  http +GET /)
    expect(logs.lines[0]).toMatch(/duration=\d+ms$/)
  })

  it("writes one JSON object per line in the JSON format", async () => {
    const logs = await startApp({ LOG_LEVEL: "info", LOG_FORMAT: "json" })

    await createApiClient(testApp).get("/auth/session")
    testApp.appModule.logger.child("check").error("Something broke", {
      error: new Error("Disk full"),
    })

    const [request, failure] = logs.lines.map((line) => JSON.parse(line))

    expect(request).toEqual({
      time: expect.any(String),
      level: "info",
      scope: "http",
      message: "GET /api/v1/auth/session",
      status: 200,
      duration: expect.stringMatching(/^\d+ms$/),
    })
    expect(failure).toEqual(
      expect.objectContaining({
        level: "error",
        scope: "check",
        error: {
          message: "Disk full",
          stack: expect.stringContaining("Error"),
        },
      })
    )
  })

  it("prints fields readably and an error's stack under its line", async () => {
    const logs = await startApp({ LOG_LEVEL: "debug", LOG_FORMAT: "pretty" })
    const logger = testApp.appModule.logger.child("check").child("nested")

    logger.debug("Details", {
      word: "plain",
      sentence: "two words",
      list: ["360p", "720p"],
      object: { a: 1 },
      date: new Date("2026-01-02T03:04:05.000Z"),
      missing: undefined,
      flag: true,
    })
    logger.warn("Careful", { error: new Error("Bad input") })

    expect(logs.lines[0]).toContain(
      'DEBUG check:nested       Details word=plain sentence="two words" list=360p,720p object={"a":1} date=2026-01-02T03:04:05.000Z flag=true'
    )
    expect(logs.lines[1]).toContain(
      'WARN  check:nested       Careful error="Bad input"\n'
    )
    expect(logs.lines[1]).toContain("logging.e2e.spec.ts")
  })

  it("leaves out records below the configured level", async () => {
    const logs = await startApp({ LOG_LEVEL: "warn" })
    const logger = testApp.appModule.logger

    logger.debug("Hidden")
    logger.info("Hidden too")
    logger.warn("Shown")

    expect(logs.lines).toHaveLength(1)
    expect(logs.lines[0]).toContain("Shown")
  })

  it.skipIf(!HAS_FFMPEG)("logs every step of processing a video", async () => {
    const logs = await startApp({ LOG_LEVEL: "debug", LOG_FORMAT: "pretty" })
    const owner = await createUserFactory(testApp).create()
    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .create({ name: "Acme", slug: "acme" })
    const library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create({ name: "Marketing" })
    const client = await signInAsUser(testApp, owner)
    const libraryPath = `/organizations/acme/libraries/${library.id}`
    const { video } = (
      await (
        await client.post(`${libraryPath}/videos`, { title: "Clip" })
      ).json()
    ).data
    const bytes = await createTestMediaFile({ seconds: 2 })
    await createTusClient(client, `${libraryPath}/videos/${video.id}`).upload(
      bytes,
      "clip.mp4",
      bytes.byteLength
    )
    const [request] = await findVideoProcessingRequests(testApp)

    await testApp.appModule.videoProcessingService.processVideo(request!, {
      isFinalAttempt: true,
    })
    const steps = logs
      .linesWith("video-processing", `videoId=${video.id}`)
      .map((line) => line.match(/video-processing\s+(.+?) videoId=/)?.[1])
      .filter((step) => step !== "Transcoding progress")

    expect(steps.slice(0, 3)).toEqual([
      "Processing started",
      "Source probed",
      "Transcoding",
    ])
    // The poster is captured while the renditions are transcoded.
    expect(steps.slice(3, 5).sort()).toEqual(["Poster created", "Transcoded"])
    expect(steps.slice(5)).toEqual(["Files uploaded", "Processing finished"])
    expect(logs.linesWith("Source probed", "resolution=640x360")).toHaveLength(
      1
    )
    expect(logs.linesWith("Transcoding", "renditions=360p")).toHaveLength(1)
  })
})
