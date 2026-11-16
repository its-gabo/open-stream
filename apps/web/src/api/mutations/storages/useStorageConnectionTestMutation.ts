import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { StorageConnectionTestBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"

/** Checks unsaved settings; resolves with whether the bucket was reached. */
export function useStorageConnectionTestMutation(organizationSlug: string) {
  const { t } = useTranslation()
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: async (payload: StorageConnectionTestBody) => {
      const { data } = await apiClient.storages.testStorageConnection(
        { organizationSlug },
        payload
      )

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
