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
import { P, match } from "ts-pattern"

import { useLibraryApiAccessQuery } from "@/api/queries/libraries/useLibraryApiAccessQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryApiKeysSection } from "@/modules/libraries/components/library-api-keys-section"
import { LibraryApiUsage } from "@/modules/libraries/components/library-api-usage"
import { LibrarySecurityForm } from "@/modules/libraries/components/library-security-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/api"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library API",
      description:
        "Upload and stream a library's videos from your own servers and sites.",
    }),
  }),
  component: LibraryApiRoute,
})

function LibraryApiRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: apiAccess, isPending } = useLibraryApiAccessQuery(
    organizationSlug,
    libraryId,
    { enabled: isOwner }
  )

  return match({ isOwner, isPending, apiAccess })
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>{t("libraries.api.owner_only_title")}</AlertTitle>
          <AlertDescription>
            {t("libraries.api.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with({ apiAccess: P.nonNullable }, ({ apiAccess: loadedAccess }) => (
      <>
        <LibraryApiKeysSection
          organizationSlug={organizationSlug}
          apiAccess={loadedAccess}
        />
        <Separator />
        <LibrarySecurityForm
          key={loadedAccess.security.allowedPlaybackHosts.join(",")}
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          security={loadedAccess.security}
        />
        <Separator />
        <LibraryApiUsage apiUrl={loadedAccess.apiUrl} />
      </>
    ))
    .with({ isPending: true }, () => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
    .otherwise(() => null)
}
