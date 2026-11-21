import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { VIDEO_CAPTION_ERRORS } from "../errors/captions.errors"
import type { TranscriptionProvidersService } from "../services/transcription-providers.service"
import type { TranscriptionProviderEnv } from "../types/captions.types"

/**
 * Resolves `:providerId` to a provider of the organization in
 * `c.get("organizationAccess")`, exposed as `c.get("transcriptionProvider")`;
 * other organizations' are reported as not found. Runs after
 * `requireOrganizationMembership`.
 */
export const requireTranscriptionProvider =
  (
    transcriptionProvidersService: TranscriptionProvidersService
  ): MiddlewareHandler<TranscriptionProviderEnv> =>
  async (c, next) => {
    const provider = await transcriptionProvidersService.findProvider(
      c.get("organizationAccess").organization.id,
      c.req.param("providerId") ?? ""
    )

    if (!provider)
      throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_NOT_FOUND)

    c.set("transcriptionProvider", provider)

    await next()
  }
