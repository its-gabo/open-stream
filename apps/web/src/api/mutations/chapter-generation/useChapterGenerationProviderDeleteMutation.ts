import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { chapterGenerationProvidersQueryKey } from "@/modules/chapter-generation/chapter-generation.query-keys"

export function useChapterGenerationProviderDeleteMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (providerId: string) =>
      apiClient.chapterGenerationProviders.deleteChapterGenerationProvider({
        organizationSlug,
        providerId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: chapterGenerationProvidersQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
