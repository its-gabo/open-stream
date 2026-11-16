import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

/** Checks a saved storage with its saved credentials; resolves with whether the bucket was reached. */
export function useSavedStorageConnectionTestMutation(
  organizationSlug: string
) {
  const { t } = useTranslation()
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: async (storageId: string) => {
      const { data } = await apiClient.storages.testSavedStorageConnection({
        organizationSlug,
        storageId,
      })

      return data.connection.isReachable
    },
    onSuccess: (isReachable) => {
      if (isReachable) {
        toast.success(t("storages.connection.reachable"))
      } else {
        toast.error(t("storages.connection.unreachable"))
      }
    },
    onError: showErrorToast,
  })
}
