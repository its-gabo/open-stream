import { WEBHOOK_DELIVERY_STATUSES } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { HistoryIcon, RotateCwIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { WEBHOOK_EVENT_TYPE_TRANSLATION_KEYS } from "../libraries.constants"

import type { WebhookDelivery } from "@/api/generated-api"

import { useLibraryWebhookDeliveryResendMutation } from "@/api/mutations/libraries/useLibraryWebhookDeliveryResendMutation"
import { useLibraryWebhookDeliveriesQuery } from "@/api/queries/libraries/useLibraryWebhookDeliveriesQuery"
import { ListPagination } from "@/modules/pagination/components/list-pagination"

type LibraryWebhookDeliveriesProps = {
  organizationSlug: string
  libraryId: string
}

function DeliveryStatusBadge({ delivery }: { delivery: WebhookDelivery }) {
  const { t } = useTranslation()

  return match(delivery.status)
    .with(WEBHOOK_DELIVERY_STATUSES.SUCCEEDED, () => (
      <Badge variant="secondary">
        {t("libraries.webhooks.deliveries.succeeded")}
      </Badge>
    ))
    .with(WEBHOOK_DELIVERY_STATUSES.FAILED, () => (
      <Badge variant="destructive">
        {t("libraries.webhooks.deliveries.failed")}
      </Badge>
    ))
    .with(WEBHOOK_DELIVERY_STATUSES.PENDING, () => (
      <Badge variant="outline">
        {delivery.attempts > 0
          ? t("libraries.webhooks.deliveries.retrying")
          : t("libraries.webhooks.deliveries.pending")}
      </Badge>
    ))
    .exhaustive()
}

/** What was sent to the webhook, newest first, with the outcome of the last attempt. */
export function LibraryWebhookDeliveries({
  organizationSlug,
  libraryId,
}: LibraryWebhookDeliveriesProps) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, isFetching } = useLibraryWebhookDeliveriesQuery(
    organizationSlug,
    libraryId,
    page
  )
  const { mutate: resendDelivery, isPending: isResendPending } =
    useLibraryWebhookDeliveryResendMutation(organizationSlug, libraryId)
  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date(value))

  return (
    <section className="flex flex-col gap-4 pt-4 sm:pt-5">
      <div className="flex items-start gap-3 px-4 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HistoryIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.webhooks.deliveries.title")}</CardTitle>
          <CardDescription>
            {t("libraries.webhooks.deliveries.description")}
          </CardDescription>
        </div>
      </div>
      {data?.deliveries.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-5">
                  {t("libraries.webhooks.deliveries.columns.event")}
                </TableHead>
                <TableHead>
                  {t("libraries.webhooks.deliveries.columns.status")}
                </TableHead>
                <TableHead>
                  {t("libraries.webhooks.deliveries.columns.response")}
                </TableHead>
                <TableHead>
                  {t("libraries.webhooks.deliveries.columns.created")}
                </TableHead>
                <TableHead className="pr-4 text-right sm:pr-5">
                  {t("libraries.webhooks.deliveries.columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="pl-4 sm:pl-5">
                    <div className="font-mono text-xs">
                      {delivery.eventType}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(
                        `libraries.webhooks.events.${WEBHOOK_EVENT_TYPE_TRANSLATION_KEYS[delivery.eventType]}`
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DeliveryStatusBadge delivery={delivery} />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("libraries.webhooks.deliveries.attempts", {
                        count: delivery.attempts,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64 text-xs">
                    {delivery.responseStatus !== null && (
                      <div className="font-mono">
                        HTTP {delivery.responseStatus}
                      </div>
                    )}
                    {delivery.lastError && (
                      <div className="text-muted-foreground">
                        {delivery.lastError}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(delivery.createdAt)}
                  </TableCell>
                  <TableCell className="pr-4 sm:pr-5">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={
                          isResendPending ||
                          delivery.status === WEBHOOK_DELIVERY_STATUSES.PENDING
                        }
                        onClick={() => resendDelivery(delivery.id)}
                      >
                        <RotateCwIcon />
                        {t("libraries.webhooks.deliveries.resend")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ListPagination
            pagination={data.pagination}
            onPageChange={setPage}
            isFetching={isFetching}
          />
        </>
      ) : (
        <div className="mx-4 mb-4 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground sm:mx-5 sm:mb-5">
          {t("libraries.webhooks.deliveries.empty")}
        </div>
      )}
    </section>
  )
}
