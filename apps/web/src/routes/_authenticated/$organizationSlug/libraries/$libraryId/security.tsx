import { createFileRoute } from "@tanstack/react-router"
import { ORGANIZATION_ROLES } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { LockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useLibraryApiAccessQuery } from "@/api/queries/libraries/useLibraryApiAccessQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibrarySecurityForm } from "@/modules/libraries/components/library-security-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/security"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library security",
      description:
        "Choose which sites may play a library's videos and whether they need signed URLs.",
    }),
  }),
  component: LibrarySecurityRoute,
})

/** The playback rules are read with the library's API access, which holds them. */
function LibrarySecurityRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const role = organizationData?.membership.role
  const isOwner = role === ORGANIZATION_ROLES.OWNER
  const { data: apiAccess, isPending } = useLibraryApiAccessQuery(
    organizationSlug,
    libraryId,
    { enabled: isOwner }
  )

  return match({ role, isOwner, isPending, apiAccess })
    .with({ role: P.nullish }, { isOwner: true, isPending: true }, () => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>{t("libraries.security.owner_only_title")}</AlertTitle>
          <AlertDescription>
            {t("libraries.security.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with({ apiAccess: P.nonNullable }, ({ apiAccess: loadedAccess }) => (
      <LibrarySecurityForm
        key={loadedAccess.security.allowedPlaybackHosts.join(",")}
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        security={loadedAccess.security}
      />
    ))
    .otherwise(() => null)
}
