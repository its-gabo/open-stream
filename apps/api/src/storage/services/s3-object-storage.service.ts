import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3"
import type {
  ObjectStorage,
  StorageByteRange,
  StorageLocation,
  StorageMultipartPart,
} from "../types/storage.types"

/** Object storage on any S3-compatible server (AWS S3, RustFS, MinIO, R2, …). */
export class S3ObjectStorageService implements ObjectStorage {
  async checkBucketAccess(location: StorageLocation) {
    await this.withClient(location, (client) =>
      client.send(new HeadBucketCommand({ Bucket: location.bucket }))
    )
  }

  async createMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    contentType: string
  ) {
    const { UploadId } = await this.withClient(location, (client) =>
      client.send(
        new CreateMultipartUploadCommand({
          Bucket: location.bucket,
          Key: objectKey,
          ContentType: contentType,
        })
      )
    )

    if (!UploadId) throw new Error("Storage returned no multipart upload id")

    return UploadId
  }

  async uploadPart(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    partNumber: number,
    body: Uint8Array
  ) {
    const { ETag } = await this.withClient(location, (client) =>
      client.send(
        new UploadPartCommand({
          Bucket: location.bucket,
          Key: objectKey,
          UploadId: multipartUploadId,
          PartNumber: partNumber,
          Body: body,
          ContentLength: body.byteLength,
        })
      )
    )

    if (!ETag) throw new Error("Storage returned no part ETag")

    return ETag
  }

  async completeMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    parts: StorageMultipartPart[]
  ) {
    await this.withClient(location, (client) =>
      client.send(
        new CompleteMultipartUploadCommand({
          Bucket: location.bucket,
          Key: objectKey,
          UploadId: multipartUploadId,
          MultipartUpload: {
            Parts: parts.map(({ partNumber, etag }) => ({
              PartNumber: partNumber,
              ETag: etag,
            })),
          },
        })
      )
    )
  }

  async abortMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string
  ) {
    await this.withClient(location, (client) =>
      client.send(
        new AbortMultipartUploadCommand({
          Bucket: location.bucket,
          Key: objectKey,
          UploadId: multipartUploadId,
        })
      )
    )
  }

  async deleteObject(location: StorageLocation, objectKey: string) {
    await this.withClient(location, (client) =>
      client.send(
        new DeleteObjectCommand({ Bucket: location.bucket, Key: objectKey })
      )
    )
  }

  /** The client lives until the body is read to the end or cancelled, as destroying it ends the body. */
  async streamObject(
    location: StorageLocation,
    objectKey: string,
    range?: StorageByteRange
  ) {
    const client = this.createClient(location)

    try {
      const { Body } = await client.send(
        new GetObjectCommand({
          Bucket: location.bucket,
          Key: objectKey,
          Range: range && `bytes=${range.start}-${range.end}`,
        })
      )

      if (!Body) throw new Error("Storage returned no object body")

      const reader = Body.transformToWebStream().getReader()

      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              client.destroy()
            } else {
              controller.enqueue(value)
            }
          } catch (error) {
            controller.error(error)
            client.destroy()
          }
        },
        async cancel(reason) {
          await reader.cancel(reason)
          client.destroy()
        },
      })
    } catch (error) {
      client.destroy()

      throw error
    }
  }

  async putObject(
    location: StorageLocation,
    objectKey: string,
    body: Uint8Array,
    contentType: string
  ) {
    await this.withClient(location, (client) =>
      client.send(
        new PutObjectCommand({
          Bucket: location.bucket,
          Key: objectKey,
          Body: body,
          ContentType: contentType,
          ContentLength: body.byteLength,
        })
      )
    )
  }

  async deleteObjectsWithPrefix(location: StorageLocation, prefix: string) {
    await this.withClient(location, async (client) => {
      let continuationToken: string | undefined

      do {
        const listed = await client.send(
          new ListObjectsV2Command({
            Bucket: location.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        )
        const keys = (listed.Contents ?? []).flatMap(({ Key }) =>
          Key ? [{ Key }] : []
        )

        if (keys.length > 0) {
          await client.send(
            new DeleteObjectsCommand({
              Bucket: location.bucket,
              Delete: { Objects: keys, Quiet: true },
            })
          )
        }

        continuationToken = listed.IsTruncated
          ? listed.NextContinuationToken
          : undefined
      } while (continuationToken)
    })
  }

  /** Signed locally with SigV4; nothing is sent to the storage. */
  async createReadUrl(
    location: StorageLocation,
    objectKey: string,
    expiresInSeconds: number
  ) {
    return new Bun.S3Client({
      endpoint: location.endpoint,
      region: location.region,
      bucket: location.bucket,
      accessKeyId: location.credentials.accessKeyId,
      secretAccessKey: location.credentials.secretAccessKey,
      virtualHostedStyle: !location.forcePathStyle,
    }).presign(objectKey, { method: "GET", expiresIn: expiresInSeconds })
  }

  /** A short-lived client per call, so custom storage credentials are not kept around. */
  private async withClient<T>(
    location: StorageLocation,
    send: (client: S3Client) => Promise<T>
  ) {
    const client = this.createClient(location)

    try {
      return await send(client)
    } finally {
      client.destroy()
    }
  }

  private createClient(location: StorageLocation) {
    return new S3Client({
      endpoint: location.endpoint,
      region: location.region,
      forcePathStyle: location.forcePathStyle,
      credentials: location.credentials,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    })
  }
}
