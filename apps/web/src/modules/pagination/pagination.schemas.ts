import { PAGINATION_LIMITS } from "@workspace/shared"
import { z } from "zod"

/** `page` and `search` of a paged list page, kept in the URL; invalid values fall back to the first page. */
export const listPageSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  search: z
    .string()
    .max(PAGINATION_LIMITS.SEARCH_MAX_LENGTH)
    .optional()
    .catch(undefined),
})
