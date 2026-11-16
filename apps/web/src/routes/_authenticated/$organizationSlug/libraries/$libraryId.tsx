import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import { ORGANIZATION_ROLES } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useLibraryQuery } from "@/api/queries/libraries/useLibraryQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { LibraryHeader } from "@/modules/libraries/components/library-header"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId"
)({
  component: LibraryLayoutRoute,
})

function LibraryLayoutRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const { data: library, isPending } = useLibraryQuery(
    organizationSlug,
    libraryId
  )

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Card className="gap-0 overflow-hidden py-0">
          {match({ isPending, library })
            .with({ isPending: true }, () => (
              <section className="space-y-4 p-4 sm:p-5">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-40 w-full" />
              </section>
            ))
            .with({ library: P.nullish }, () => (
              <section className="flex flex-col items-center gap-4 p-10 text-center">
                <div>
                  <h1 className="font-heading text-xl font-semibold">
                    {t("libraries.not_found.title")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("libraries.not_found.description")}
                  </p>
                </div>
                <Button
                  render={
                    <Link
                      to="/$organizationSlug/libraries"
                      params={{ organizationSlug }}
                    />
                  }
                >
                  {t("libraries.not_found.back")}
                </Button>
              </section>
            ))
            .with({ library: P.nonNullable }, ({ library: loadedLibrary }) => (
              <>
                <LibraryHeader
                  organizationSlug={organizationSlug}
                  library={loadedLibrary}
                  isOwner={
                    organizationData?.membership.role ===
                    ORGANIZATION_ROLES.OWNER
                  }
                />
                <Outlet />
              </>
            ))
            .exhaustive()}
        </Card>
      </div>
    </div>
  )
}
