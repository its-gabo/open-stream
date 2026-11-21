import { useMutation } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

type VideoChapterSuggestionsVariables = {
  captionId: string
  /** Aborts the request, e.g. when the member closes the dialog; no error is shown then. */
  signal: AbortSignal
}

/**
 * Asks the library's provider for chapters written from a caption track; nothing is saved.
 * Pass `onSuccess` to `mutate` rather than the hook, so a late answer is dropped once the caller unmounts.
 */
export function useVideoChapterSuggestionsMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string
) {
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: async ({
      captionId,
      signal,
    }: VideoChapterSuggestionsVariables) =>
      (
        await apiClient.libraries.suggestVideoChapters(
          { organizationSlug, libraryId, videoId },
          { captionId },
          { signal }
        )
      ).data.chapters,
    onError: (error, { signal }) => {
      if (!signal.aborted) showErrorToast(error)
    },
  })
}
