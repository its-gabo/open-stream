import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { WEBHOOK_DELIVERY_STATUSES } from "@workspace/shared"

import { apiClient } from "@/api/api-client"
import {
  VIDEO_UPLOAD_STATE_POLL_INTERVAL_MS,
  WEBHOOK_DELIVERIES_PAGE_SIZE,
} from "@/modules/libraries/libraries.constants"
import { libraryWebhookDeliveryPageQueryKey } from "@/modules/libraries/libraries.query-keys"

/** One page of what was sent to the webhook; polls while a delivery on it is still being sent. */
export function useLibraryWebhookDeliveriesQuery(
  organizationSlug: string,
  libraryId: string,
  page: number
) {
  return useQuery({
    queryKey: libraryWebhookDeliveryPageQueryKey(
      organizationSlug,
      libraryId,
      page
    ),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.libraries.listLibraryWebhookDeliveries({
        organizationSlug,
        libraryId,
        page,
        pageSize: WEBHOOK_DELIVERIES_PAGE_SIZE,
      })

      return data
    },
    refetchInterval: (query) =>
      query.state.data?.deliveries.some(
        (delivery) => delivery.status === WEBHOOK_DELIVERY_STATUSES.PENDING
      )
        ? VIDEO_UPLOAD_STATE_POLL_INTERVAL_MS
        : false,
  })
}
