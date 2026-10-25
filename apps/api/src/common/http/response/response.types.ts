export type ApiResult<TCode extends string = string> = {
  code: TCode
  message: string
}

export type ApiSuccessResponse<
  TCode extends string,
  TData,
> = ApiResult<TCode> & {
  data: TData
}

export type ApiErrorResponse<TCode extends string = string> =
  ApiResult<TCode> & {
    reason: string
  }

/** One `ApiResult` per key of `TCodes`, each bound to exactly that key's code. */
export type ApiResultCatalog<TCodes extends Record<string, string>> = {
  readonly [Name in keyof TCodes]: ApiResult<TCodes[Name]>
}

/** One error response per key of `TCodes`, each bound to exactly that key's code. */
export type ApiErrorResponseCatalog<TCodes extends Record<string, string>> = {
  readonly [Name in keyof TCodes]: ApiErrorResponse<TCodes[Name]>
}
