import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { STORAGE_ERRORS } from "../errors/storages.errors"
import type { StoragesService } from "../services/storages.service"
import type { StorageEnv } from "../types/storage.types"

/**
 * Resolves the `:storageId` param to a storage of the organization in
 * `c.get("organizationAccess")`, exposed as `c.get("storage")`. Storages of
 * other organizations are reported as not found. Runs after
 * `requireOrganizationMembership`.
 */
export const requireStorage =
  (storagesService: StoragesService): MiddlewareHandler<StorageEnv> =>
  async (c, next) => {
    const storage = await storagesService.findStorage(
      c.get("organizationAccess").organization.id,
      c.req.param("storageId") ?? ""
    )

    if (!storage) throw new DomainError(STORAGE_ERRORS.NOT_FOUND)

    c.set("storage", storage)

    await next()
  }
