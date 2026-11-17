import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { createPageMeta } from "@/lib/page-meta"
import { LibraryAnalyticsView } from "@/modules/analytics/components/library-analytics-view"
import { analyticsSearchSchema } from "@/modules/analytics/analytics.schemas"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/analytics"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library analytics",
      description: "Views and watch time of a library's videos.",
    }),
  }),
  validateSearch: analyticsSearchSchema,
  component: LibraryAnalyticsRoute,
})

function LibraryAnalyticsRoute() {
  const { organizationSlug, libraryId } = Route.useParams()
  const { days } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <LibraryAnalyticsView
      organizationSlug={organizationSlug}
      libraryId={libraryId}
      days={days}
      onDaysChange={(picked) => void navigate({ search: { days: picked } })}
    />
  )
}
