import { describe, expect, it } from "bun:test"

import { S3ObjectStorageService } from "../services/s3-object-storage.service"
import type { StorageLocation } from "../types/storage.types"

const location: StorageLocation = {
  endpoint: "https://account.r2.cloudflarestorage.com",
  region: "auto",
  bucket: "open-stream",
  forcePathStyle: false,
  credentials: { accessKeyId: "key", secretAccessKey: "secret" },
}

async function readUrl(overrides: Partial<StorageLocation>) {
  const url = await new S3ObjectStorageService().createReadUrl(
    { ...location, ...overrides },
    "library/video/source",
    60
  )
  return new URL(url)
}

describe("S3 object storage read URLs", () => {
  it("puts the bucket in the host for virtual-hosted-style storage", async () => {
    const url = await readUrl({ forcePathStyle: false })

    expect(url.host).toBe("open-stream.account.r2.cloudflarestorage.com")
    expect(url.pathname).toBe("/library/video/source")
  })

  it("puts the bucket in the path for path-style storage", async () => {
    const url = await readUrl({ forcePathStyle: true })

    expect(url.host).toBe("account.r2.cloudflarestorage.com")
    expect(url.pathname).toBe("/open-stream/library/video/source")
  })

  it("keeps the endpoint's port", async () => {
    const url = await readUrl({
      endpoint: "http://storage.example.com:9000",
      forcePathStyle: false,
    })

    expect(url.host).toBe("open-stream.storage.example.com:9000")
  })
})
