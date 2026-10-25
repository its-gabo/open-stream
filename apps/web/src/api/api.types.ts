export type ApiMutationOptions<TResult = void> = {
  onSuccess?: (result: TResult) => void
}
