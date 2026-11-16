import type { PaginationDto, PaginationQuery } from "./pagination.schemas"

type PageRequest = Pick<PaginationQuery, "page" | "pageSize">
import type { PageWindow } from "./pagination.types"

export const toPageWindow = (query: PageRequest): PageWindow => ({
  limit: query.pageSize,
  offset: (query.page - 1) * query.pageSize,
})

export const toPaginationDto = (
  query: PageRequest,
  totalItems: number
): PaginationDto => ({
  page: query.page,
  pageSize: query.pageSize,
  totalItems,
  totalPages: Math.ceil(totalItems / query.pageSize),
})
