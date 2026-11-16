import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesService } from "../services/libraries.service"
import type { LibraryEnv } from "../types/libraries.types"

/**
 * Resolves the `:libraryId` param to a library of the organization in
 * `c.get("organizationAccess")`, exposed as `c.get("library")`. Libraries of
 * other organizations are reported as not found. Runs after
 * `requireOrganizationMembership`.
 */
export const requireLibrary =
  (librariesService: LibrariesService): MiddlewareHandler<LibraryEnv> =>
  async (c, next) => {
    const library = await librariesService.findLibrary(
      c.get("organizationAccess").organization.id,
      c.req.param("libraryId") ?? ""
    )

    if (!library) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

    c.set("library", library)

    await next()
  }
