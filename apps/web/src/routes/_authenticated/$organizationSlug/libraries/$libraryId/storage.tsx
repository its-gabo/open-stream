import { Navigate, createFileRoute } from "@tanstack/react-router"
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

import { useLibraryQuery } from "@/api/queries/libraries/useLibraryQuery"
import { useLibraryStorageQuery } from "@/api/queries/libraries/useLibraryStorageQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryStorageForm } from "@/modules/libraries/components/library-storage-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/storage"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library storage",
      description: "Choose where the videos of a library are stored.",
    }),
  }),
  component: LibraryStorageRoute,
})

function LibraryStorageRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: library } = useLibraryQuery(organizationSlug, libraryId)
  const { data: storage, isPending } = useLibraryStorageQuery(
    organizationSlug,
    libraryId,
    { enabled: isOwner }
  )

  if (library?.isStorageLocked) {
    return (
      <Navigate
        to="/$organizationSlug/libraries/$libraryId"
        params={{ organizationSlug, libraryId }}
        replace
      />
    )
  }

  return match({ isOwner, isPending, storage })
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>{t("libraries.storage.owner_only_title")}</AlertTitle>
          <AlertDescription>
            {t("libraries.storage.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with({ storage: P.nonNullable }, ({ storage: loadedStorage }) => (
      <LibraryStorageForm
        key={loadedStorage.custom?.id ?? loadedStorage.kind}
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        storage={loadedStorage}
      />
    ))
    .with({ isPending: true }, () => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
    .otherwise(() => null)
}
