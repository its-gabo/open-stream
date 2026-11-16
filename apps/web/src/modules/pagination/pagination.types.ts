/** One page of a list the API searches and pages. */
export type ListPageParams = {
  page: number
  pageSize: number
  search: string
}

/** `page` and `search` of a list page, as kept in the URL. */
export type ListPageSearch = {
  page?: number
  search?: string
}
