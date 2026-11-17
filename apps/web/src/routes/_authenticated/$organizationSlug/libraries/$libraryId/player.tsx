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

import { useLibraryPlayerQuery } from "@/api/queries/libraries/useLibraryPlayerQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryPlayerForm } from "@/modules/libraries/components/library-player-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/player"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library player",
      description: "Choose how a library's embedded player looks.",
    }),
  }),
  component: LibraryPlayerRoute,
})

function LibraryPlayerRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const role = organizationData?.membership.role
  const isOwner = role === ORGANIZATION_ROLES.OWNER
  const { data: player, isPending } = useLibraryPlayerQuery(
    organizationSlug,
    libraryId,
    { enabled: isOwner }
  )

  return match({ role, isOwner, isPending, player })
    .with({ role: P.nullish }, { isOwner: true, isPending: true }, () => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>{t("libraries.player.owner_only_title")}</AlertTitle>
          <AlertDescription>
            {t("libraries.player.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with({ player: P.nonNullable }, ({ player: loadedPlayer }) => (
      <LibraryPlayerForm
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        player={loadedPlayer}
      />
    ))
    .otherwise(() => null)
}
