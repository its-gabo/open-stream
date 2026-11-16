import {
  activityActorOfApiKey,
  readActivityRequestSource,
} from "../../activity/utils/activity-actor.utils"
import type { LibraryApiKeyScope } from "@workspace/shared"
import type { MiddlewareHandler } from "hono"
import type { LibraryApiAccessService } from "../services/library-api-access.service"
import type { LibraryApiEnv } from "../types/libraries.types"
import { readBearerApiKey } from "../utils/library-api.utils"

/**
 * Authenticates library API requests: the `:libraryId` param must name the
 * library whose key is sent as `Authorization: Bearer <key>`, and the key must
 * hold `requiredScope`. Exposes `c.get("library")`, `c.get("apiKey")`
 * and `c.get("activityActor")`.
 */
export const requireLibraryApiKey =
  (
    libraryApiAccessService: LibraryApiAccessService,
    requiredScope: LibraryApiKeyScope
  ): MiddlewareHandler<LibraryApiEnv> =>
  async (c, next) => {
    const { library, apiKey } =
      await libraryApiAccessService.authenticateLibrary(
        c.req.param("libraryId") ?? "",
        readBearerApiKey(c.req.header("authorization")),
        requiredScope
      )

    c.set("library", library)
    c.set("apiKey", apiKey)
    c.set(
      "activityActor",
      activityActorOfApiKey(apiKey, readActivityRequestSource(c.req))
    )

    await next()
  }
