import { afterEach, describe, expect, it } from "bun:test"

import { startFileServer } from "../../../test/helpers/file-server"
import { VideoImportError } from "../errors/video-import.error"
import { openImportDownload } from "../utils/video-import-request.utils"
import { isAllowedImportUrl } from "../utils/video-import-url.utils"

/** The test server is on loopback, so it alone is let through as if it were public. */
const isPublicOrTestServer = (testServerHost: string) => (url: string) =>
  URL.parse(url)?.host === testServerHost ||
  isAllowedImportUrl(url, { allowPrivateNetwork: false })

describe("openImportDownload", () => {
  let fileServer: ReturnType<typeof startFileServer>

  afterEach(() => fileServer.stop())

  it.each([
    "http://10.0.0.8/clip.mp4",
    "http://169.254.169.254/latest/meta-data",
    "http://localhost/clip.mp4",
    "file:///etc/passwd",
  ])("refuses a redirect to %s without following it", async (location) => {
    fileServer = startFileServer({
      "/clip.mp4": () =>
        new Response(null, { status: 302, headers: { location } }),
    })

    const error = await openImportDownload(fileServer.url("/clip.mp4"), {
      isAllowedUrl: isPublicOrTestServer(fileServer.host),
      timeoutMs: 5000,
    }).then(
      () => null,
      (rejection: unknown) => rejection
    )

    expect(error).toBeInstanceOf(VideoImportError)
    expect(error).toMatchObject({
      reason: "import_unreachable",
      message: "The URL is not a public HTTP or HTTPS address",
      isPermanent: true,
    })
    expect(fileServer.requestedPaths).toEqual(["/clip.mp4"])
  })
})
