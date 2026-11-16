import type {
  ObjectStorage,
  StorageByteRange,
  StorageLocation,
  StorageMultipartPart,
} from "../../src/storage/types/storage.types"

type MultipartUpload = {
  bucketKey: string
  objectKey: string
  contentType: string
  parts: Map<number, { etag: string; bytes: Uint8Array }>
}

const bucketKeyOf = (location: StorageLocation) =>
  `${location.endpoint}|${location.bucket}`

/**
 * In-memory S3-compatible storage. Buckets exist only once `addBucket` is
 * called for their endpoint, bucket and credentials, and `failRequests`
 * simulates an outage.
 */
export class InMemoryObjectStorage implements ObjectStorage {
  private readonly buckets = new Map<string, StorageLocation["credentials"]>()
  private readonly objects = new Map<string, Uint8Array>()
  private readonly multipartUploads = new Map<string, MultipartUpload>()
  private uploadSequence = 0
  private readonly readUrlKeys = new Map<string, string>()
  private readServer: ReturnType<typeof Bun.serve> | null = null
  isFailing = false
  /** Requests made to read URLs, e.g. by ffmpeg. */
  readUrlRequestCount = 0

  addBucket(location: StorageLocation) {
    this.buckets.set(bucketKeyOf(location), location.credentials)
  }

  failRequests(isFailing = true) {
    this.isFailing = isFailing
  }

  /** Object keys stored in a bucket, sorted. */
  listObjectKeys(location: Pick<StorageLocation, "endpoint" | "bucket">) {
    const prefix = `${location.endpoint}|${location.bucket}|`

    return [...this.objects.keys()]
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
      .sort()
  }

  readObject(
    location: Pick<StorageLocation, "endpoint" | "bucket">,
    objectKey: string
  ) {
    return (
      this.objects.get(
        `${location.endpoint}|${location.bucket}|${objectKey}`
      ) ?? null
    )
  }

  /** Multipart uploads started and neither completed nor aborted. */
  countOpenMultipartUploads() {
    return this.multipartUploads.size
  }

  async checkBucketAccess(location: StorageLocation) {
    this.assertAccess(location)
  }

  async createMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    contentType: string
  ) {
    this.assertAccess(location)

    const multipartUploadId = `multipart-${++this.uploadSequence}`

    this.multipartUploads.set(multipartUploadId, {
      bucketKey: bucketKeyOf(location),
      objectKey,
      contentType,
      parts: new Map(),
    })

    return multipartUploadId
  }

  async uploadPart(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    partNumber: number,
    body: Uint8Array
  ) {
    const upload = this.findMultipartUpload(
      location,
      objectKey,
      multipartUploadId
    )
    const etag = `"${multipartUploadId}-${partNumber}"`

    upload.parts.set(partNumber, { etag, bytes: body.slice() })

    return etag
  }

  async completeMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    parts: StorageMultipartPart[]
  ) {
    const upload = this.findMultipartUpload(
      location,
      objectKey,
      multipartUploadId
    )
    const chunks = parts.map(({ partNumber, etag }) => {
      const part = upload.parts.get(partNumber)

      if (part?.etag !== etag) throw new Error(`Invalid part ${partNumber}`)

      return part.bytes
    })

    this.objects.set(
      `${upload.bucketKey}|${objectKey}`,
      new Uint8Array(Buffer.concat(chunks))
    )
    this.multipartUploads.delete(multipartUploadId)
  }

  async abortMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string
  ) {
    this.findMultipartUpload(location, objectKey, multipartUploadId)
    this.multipartUploads.delete(multipartUploadId)
  }

  async deleteObject(location: StorageLocation, objectKey: string) {
    this.assertAccess(location)
    this.objects.delete(`${bucketKeyOf(location)}|${objectKey}`)
  }

  async streamObject(
    location: StorageLocation,
    objectKey: string,
    range?: StorageByteRange
  ) {
    this.assertAccess(location)

    const bytes = this.objects.get(`${bucketKeyOf(location)}|${objectKey}`)

    if (!bytes) throw new Error("No such key")

    return new Blob([
      range ? bytes.slice(range.start, range.end + 1) : bytes.slice(),
    ]).stream()
  }

  /** Served from a local HTTP server with range requests, as S3 serves a signed URL. */
  async createReadUrl(location: StorageLocation, objectKey: string) {
    this.assertAccess(location)

    const token = crypto.randomUUID()

    this.readUrlKeys.set(token, `${bucketKeyOf(location)}|${objectKey}`)

    return `${this.startReadServer().url}objects/${token}?X-Amz-Signature=test-signature`
  }

  async putObject(
    location: StorageLocation,
    objectKey: string,
    body: Uint8Array
  ) {
    this.assertAccess(location)
    this.objects.set(`${bucketKeyOf(location)}|${objectKey}`, body.slice())
  }

  async deleteObjectsWithPrefix(location: StorageLocation, prefix: string) {
    this.assertAccess(location)

    const keyPrefix = `${bucketKeyOf(location)}|${prefix}`

    for (const key of [...this.objects.keys()]) {
      if (key.startsWith(keyPrefix)) this.objects.delete(key)
    }
  }

  private assertAccess(location: StorageLocation) {
    if (this.isFailing) throw new Error("Storage is unavailable")

    const credentials = this.buckets.get(bucketKeyOf(location))

    if (
      credentials?.accessKeyId !== location.credentials.accessKeyId ||
      credentials.secretAccessKey !== location.credentials.secretAccessKey
    ) {
      throw new Error("Access denied")
    }
  }

  private findMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string
  ) {
    this.assertAccess(location)

    const upload = this.multipartUploads.get(multipartUploadId)

    if (
      upload?.bucketKey !== bucketKeyOf(location) ||
      upload.objectKey !== objectKey
    ) {
      throw new Error("No such upload")
    }

    return upload
  }

  private startReadServer() {
    this.readServer ??= Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (request) => this.serveObject(request),
    })
    this.readServer.unref()

    return this.readServer
  }

  private serveObject(request: Request) {
    this.readUrlRequestCount += 1

    if (this.isFailing) return new Response(null, { status: 503 })

    const token = new URL(request.url).pathname.split("/").at(-1) ?? ""
    const objectKey = this.readUrlKeys.get(token)
    const bytes = objectKey ? this.objects.get(objectKey) : undefined

    if (!bytes) return new Response(null, { status: 404 })

    const range = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/)

    if (!range) {
      return new Response(bytes.slice(), {
        headers: { "accept-ranges": "bytes" },
      })
    }

    const start = Number(range[1])
    const end = range[2] ? Number(range[2]) : bytes.byteLength - 1

    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: {
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${bytes.byteLength}`,
      },
    })
  }
}
