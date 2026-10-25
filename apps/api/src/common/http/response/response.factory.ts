import type { ApiResult, ApiSuccessResponse } from "./response.types"

export const createApiSuccessResponse = <TCode extends string, TData>(
  result: ApiResult<TCode>,
  data: TData
): ApiSuccessResponse<TCode, TData> => ({
  code: result.code,
  message: result.message,
  data,
})
