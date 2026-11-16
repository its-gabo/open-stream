import { createFileRoute } from "@tanstack/react-router"
import { ORGANIZATION_ROLES } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { LockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { useLibraryWebhookQuery } from "@/api/queries/libraries/useLibraryWebhookQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryWebhookDeliveries } from "@/modules/libraries/components/library-webhook-deliveries"
import { LibraryWebhookSection } from "@/modules/libraries/components/library-webhook-section"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/webhooks"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library webhooks",
      description: "Get told when a library's videos are processed.",
    }),
  }),
  component: LibraryWebhooksRoute,
})

function LibraryWebhooksRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: webhook, isPending } = useLibraryWebhookQuery(
    organizationSlug,
    libraryId,
    { enabled: isOwner }
  )

  return match({ isOwner, isPending })
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>{t("libraries.webhooks.owner_only_title")}</AlertTitle>
          <AlertDescription>
            {t("libraries.webhooks.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with({ isPending: true }, () => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
    .otherwise(() => (
      <>
        <LibraryWebhookSection
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          webhook={webhook ?? null}
        />
        {webhook && (
          <>
            <Separator />
            <LibraryWebhookDeliveries
              organizationSlug={organizationSlug}
              libraryId={libraryId}
            />
          </>
        )}
      </>
    ))
}
