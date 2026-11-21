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

import { useLibraryTranscriptionQuery } from "@/api/queries/libraries/useLibraryTranscriptionQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useTranscriptionProvidersQuery } from "@/api/queries/transcription/useTranscriptionProvidersQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryTranscriptionForm } from "@/modules/transcription/components/library-transcription-form"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/transcription"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library transcription",
      description:
        "Choose the provider that turns a library's videos into captions.",
    }),
  }),
  component: LibraryTranscriptionRoute,
})

function LibraryTranscriptionRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const settings = useLibraryTranscriptionQuery(organizationSlug, libraryId, {
    enabled: isOwner,
  })
  const providers = useTranscriptionProvidersQuery(organizationSlug, {
    enabled: isOwner,
  })

  return match({ isOwner, settings: settings.data, providers: providers.data })
    .with({ isOwner: false }, () => (
      <section className="p-4 sm:p-5">
        <Alert>
          <LockIcon />
          <AlertTitle>
            {t("libraries.transcription.owner_only_title")}
          </AlertTitle>
          <AlertDescription>
            {t("libraries.transcription.owner_only_description")}
          </AlertDescription>
        </Alert>
      </section>
    ))
    .with(
      { settings: P.nonNullable, providers: P.nonNullable },
      ({ settings: loadedSettings, providers: loadedProviders }) => (
        <LibraryTranscriptionForm
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
