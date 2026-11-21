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

import { useLibraryChapterGenerationQuery } from "@/api/queries/libraries/useLibraryChapterGenerationQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useChapterGenerationProvidersQuery } from "@/api/queries/chapter-generation/useChapterGenerationProvidersQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryChapterGenerationForm } from "@/modules/chapter-generation/components/library-chapter-generation-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/chapter-generation"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library chapter generation",
      description:
        "Choose the provider that writes chapters for a library's videos from their captions.",
    }),
  }),
  component: LibraryChapterGenerationRoute,
})

function LibraryChapterGenerationRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const settings = useLibraryChapterGenerationQuery(
    organizationSlug,
    libraryId,
    {
      enabled: isOwner,
    }
  )
  const providers = useChapterGenerationProvidersQuery(organizationSlug, {
    enabled: isOwner,
  })

  return match({ isOwner, settings: settings.data, providers: providers.data })
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>
            {t("libraries.chapter_generation.owner_only_title")}
          </AlertTitle>
          <AlertDescription>
            {t("libraries.chapter_generation.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with(
      { settings: P.nonNullable, providers: P.nonNullable },
      ({ settings: loadedSettings, providers: loadedProviders }) => (
        <LibraryChapterGenerationForm
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          settings={loadedSettings}
          providers={loadedProviders}
        />
      )
    )
    .otherwise(() => (
      <section className="p-4 sm:p-5">
        <Skeleton className="h-64 w-full" />
      </section>
    ))
}
