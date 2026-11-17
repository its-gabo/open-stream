import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { createPageMeta } from "@/lib/page-meta"
import { analyticsSearchSchema } from "@/modules/analytics/analytics.schemas"
import { OrganizationAnalyticsView } from "@/modules/analytics/components/organization-analytics-view"

export const Route = createFileRoute("/_authenticated/$organizationSlug/")({
  head: () => ({
    meta: createPageMeta({
      title: "Dashboard",
      description: "Views and watch time across your OpenStream workspace.",
    }),
  }),
  validateSearch: analyticsSearchSchema,
  component: OrganizationDashboardRoute,
})

function OrganizationDashboardRoute() {
  const { organizationSlug } = Route.useParams()
  const { days } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationAnalyticsView
          organizationSlug={organizationSlug}
          days={days}
          onDaysChange={(picked) =>
            void navigate({ search: { days: picked }, replace: true })
          }
        />
      </div>
    </div>
  )
}
