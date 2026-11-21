import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { CHAPTER_GENERATION_ERRORS } from "../errors/chapter-generation.errors"
import type { ChapterGenerationProvidersService } from "../services/chapter-generation-providers.service"
import type { ChapterGenerationProviderEnv } from "../types/chapter-generation.types"

/**
 * Resolves `:providerId` to a provider of the organization in
 * `c.get("organizationAccess")`, exposed as
 * `c.get("chapterGenerationProvider")`; other organizations' are reported
 * as not found. Runs after `requireOrganizationMembership`.
 */
export const requireChapterGenerationProvider =
  (
    chapterGenerationProvidersService: ChapterGenerationProvidersService
  ): MiddlewareHandler<ChapterGenerationProviderEnv> =>
  async (c, next) => {
    const provider = await chapterGenerationProvidersService.findProvider(
      c.get("organizationAccess").organization.id,
      c.req.param("providerId") ?? ""
    )

    if (!provider)
      throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_NOT_FOUND)

    c.set("chapterGenerationProvider", provider)

    await next()
  }
