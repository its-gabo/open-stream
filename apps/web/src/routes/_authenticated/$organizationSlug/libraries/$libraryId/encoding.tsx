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

import { useLibraryEncodingQuery } from "@/api/queries/libraries/useLibraryEncodingQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryEncodingForm } from "@/modules/libraries/components/library-encoding-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/encoding"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library encoding",
      description: "Choose the qualities a library transcodes its videos to.",
    }),
  }),
  component: LibraryEncodingRoute,
})

function LibraryEncodingRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: encoding, isPending } = useLibraryEncodingQuery(
    organizationSlug,
    libraryId,
    { enabled: isOwner }
  )

  return match({ isOwner, isPending, encoding })
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>{t("libraries.encoding.owner_only_title")}</AlertTitle>
          <AlertDescription>
            {t("libraries.encoding.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with({ encoding: P.nonNullable }, ({ encoding: loadedEncoding }) => (
      <LibraryEncodingForm
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        encoding={loadedEncoding}
      />
    ))
    .with({ isPending: true }, () => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
    .otherwise(() => null)
}
