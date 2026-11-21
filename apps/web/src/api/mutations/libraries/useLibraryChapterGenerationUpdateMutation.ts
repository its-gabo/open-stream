import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryChapterGenerationUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { chapterGenerationProvidersQueryKey } from "@/modules/chapter-generation/chapter-generation.query-keys"
import { libraryChapterGenerationQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryChapterGenerationUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryChapterGenerationUpdateBody) =>
      apiClient.libraries.updateLibraryChapterGenerationSettings(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        libraryChapterGenerationQueryKey(organizationSlug, libraryId),
        response.data.chapterGeneration
      )
      await queryClient.invalidateQueries({
        queryKey: chapterGenerationProvidersQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
