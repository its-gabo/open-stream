import { useMutation, useQueryClient } from "@tanstack/react-query"

import type {
  ChapterGenerationProvider,
  ChapterGenerationProviderCreateBody,
  ChapterGenerationProviderUpdateBody,
} from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { chapterGenerationProvidersQueryKey } from "@/modules/chapter-generation/chapter-generation.query-keys"

/** What saving a provider sends: a new provider, or the changes to one. */
export type ChapterGenerationProviderSave =
  | { providerId: null; payload: ChapterGenerationProviderCreateBody }
  | { providerId: string; payload: ChapterGenerationProviderUpdateBody }

/** Creates a provider, or changes one when `providerId` is set. */
export function useChapterGenerationProviderSaveMutation(
  organizationSlug: string,
  options: ApiMutationOptions<ChapterGenerationProvider> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (save: ChapterGenerationProviderSave) =>
      save.providerId === null
        ? apiClient.chapterGenerationProviders.createChapterGenerationProvider(
            { organizationSlug },
            save.payload
          )
        : apiClient.chapterGenerationProviders.updateChapterGenerationProvider(
            { organizationSlug, providerId: save.providerId },
            save.payload
          ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: chapterGenerationProvidersQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data.provider)
    },
    onError: showErrorToast,
  })
}
