import { Factory } from "fishery"

import { TEST_REQUEST_SOURCE, activityActorOf } from "../helpers/activity"

import type {
  StorageCreateBody,
  StorageDto,
} from "../../src/storage/dto/storages.schemas"
import type { TestApp } from "../helpers/test-app"
import type { UserCredentials } from "./user.factory"

type StorageFactoryTransientParams = {
  organizationSlug: string
  owner: UserCredentials
}

class StorageFactory extends Factory<
  StorageCreateBody,
  StorageFactoryTransientParams,
  StorageDto
> {
  /** The organization the storage is created in, by its owner. */
  inOrganization(organizationSlug: string, owner: UserCredentials) {
    return this.transient({ organizationSlug, owner })
  }
}

/** Creates reachable storages through the same service as the API; their bucket is added to the in-memory storage. */
export const createStorageFactory = (testApp: TestApp) =>
  StorageFactory.define(({ onCreate, sequence, transientParams }) => {
    const { authSessionService, organizationsService, storagesService } =
      testApp.appModule

    onCreate(async (storage) => {
      const { organizationSlug, owner } = transientParams

      if (!organizationSlug || !owner) {
        throw new Error("Use inOrganization(slug, owner) to create storages")
      }

      testApp.objectStorage.addBucket({
        endpoint: storage.endpoint,
        region: storage.region,
        bucket: storage.bucket,
        forcePathStyle: storage.forcePathStyle,
        credentials: {
          accessKeyId: storage.accessKeyId,
          secretAccessKey: storage.secretAccessKey,
        },
      })

      const { session } = await authSessionService.signInWithEmail(
        owner,
        null,
        TEST_REQUEST_SOURCE
      )
      const access = await organizationsService.findAccess(
        session.userId,
        organizationSlug
      )

      return (
        await storagesService.createStorage(
          access!,
          activityActorOf(session),
          storage
        )
      ).storage
    })

    return {
      name: `Storage ${sequence}`,
      endpoint: "https://s3.factory-storage.test",
      region: "eu-central-1",
      bucket: `bucket-${sequence}`,
      forcePathStyle: true,
      pathTemplate: "{libraryId}/{videoId}",
      accessKeyId: `factory-key-${sequence}`,
      secretAccessKey: `factory-secret-${sequence}`,
    }
  })
