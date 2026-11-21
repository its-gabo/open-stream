import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

/** Checks a saved provider answers and takes its key, and says so in a toast. */
export function useTranscriptionProviderTestMutation(organizationSlug: string) {
  const { t } = useTranslation()
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: async (providerId: string) => {
      const { data } =
        await apiClient.transcriptionProviders.testTranscriptionProvider({
          organizationSlug,
          providerId,
        })

      return data.connection
    },
    onSuccess: ({ isReachable, isAuthorized }) => {
      if (!isReachable) toast.error(t("transcription.connection.unreachable"))
      else if (!isAuthorized)
        toast.error(t("transcription.connection.unauthorized"))
      else toast.success(t("transcription.connection.working"))
    },
    onError: showErrorToast,
  })
}
