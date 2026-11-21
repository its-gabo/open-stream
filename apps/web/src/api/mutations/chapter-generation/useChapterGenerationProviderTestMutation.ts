import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

/** Checks a saved provider answers and takes its key, and says so in a toast. */
export function useChapterGenerationProviderTestMutation(
  organizationSlug: string
) {
  const { t } = useTranslation()
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: async (providerId: string) => {
      const { data } =
        await apiClient.chapterGenerationProviders.testChapterGenerationProvider(
          { organizationSlug, providerId }
        )

      return data.connection
    },
    onSuccess: ({ isReachable, isAuthorized }) => {
      if (!isReachable)
        toast.error(t("chapter_generation.connection.unreachable"))
      else if (!isAuthorized)
        toast.error(t("chapter_generation.connection.unauthorized"))
      else toast.success(t("chapter_generation.connection.working"))
    },
    onError: showErrorToast,
  })
}
