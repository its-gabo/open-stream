import { PAGINATION_LIMITS } from "@workspace/shared"
import { z } from "zod"

/** Page, page size and an optional search; a blank search means no search. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_LIMITS.MAX_PAGE_SIZE)
    .default(PAGINATION_LIMITS.DEFAULT_PAGE_SIZE),
  search: z
    .string()
    .trim()
    .max(PAGINATION_LIMITS.SEARCH_MAX_LENGTH)
    .optional()
    .transform((search) => search || undefined),
})

export const paginationDtoSchema = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1),
    totalItems: z.int().nonnegative(),
    totalPages: z.int().nonnegative(),
  })
  .meta({ id: "Pagination" })

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type PaginationDto = z.infer<typeof paginationDtoSchema>
