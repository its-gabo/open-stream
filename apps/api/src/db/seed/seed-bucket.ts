import {
  CreateBucketCommand,
  HeadBucketCommand,
  NotFound,
  S3Client,
} from "@aws-sdk/client-s3"
import type { AppConfig } from "../../config/app.config"

/**
 * Creates `bucket` on the default storage's S3 server (RustFS locally) when
 * it does not exist yet, with that server's own credentials, so a seeded
 * custom storage has a bucket of its own to point at.
 */
export async function ensureSeedBucket(config: AppConfig, bucket: string) {
  const client = new S3Client({
    endpoint: config.OBJECT_STORAGE_ENDPOINT,
    region: config.OBJECT_STORAGE_REGION,
    forcePathStyle: config.OBJECT_STORAGE_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: config.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    },
  })

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch (error) {
    if (!(error instanceof NotFound)) throw error

    await client.send(new CreateBucketCommand({ Bucket: bucket }))
  } finally {
    client.destroy()
  }
}
