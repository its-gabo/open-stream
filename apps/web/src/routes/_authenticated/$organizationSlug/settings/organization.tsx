import { createFileRoute } from "@tanstack/react-router"
import { ORGANIZATION_ROLES, ORGANIZATION_STATUSES } from "@workspace/shared"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { P, match } from "ts-pattern"

import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useOrganizationTeamQuery } from "@/api/queries/organizations/useOrganizationTeamQuery"
import { createPageMeta } from "@/lib/page-meta"
import { OrganizationDangerZone } from "@/modules/organizations/components/organization-danger-zone"
import { OrganizationProfileForm } from "@/modules/organizations/components/organization-profile-form"
import { OrganizationProfileReadonly } from "@/modules/organizations/components/organization-profile-readonly"
import { OrganizationSettingsHeader } from "@/modules/organizations/components/organization-settings-header"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/settings/organization"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Organization profile",
      description: "Manage your organization name and workspace URL.",
    }),
  }),
  component: OrganizationSettingsRoute,
})

function OrganizationSettingsRoute() {
  const { organizationSlug } = Route.useParams()
  const { data } = useOrganizationQuery(organizationSlug)
  const isOwner = data?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: team } = useOrganizationTeamQuery(organizationSlug, {
    enabled:
      isOwner && data.organization.status === ORGANIZATION_STATUSES.ACTIVE,
  })

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Card className="gap-0 overflow-hidden py-0">
          <OrganizationSettingsHeader organizationSlug={organizationSlug} />
          {match(data)
            .with(P.nullish, () => (
              <>
                <section className="p-4 sm:p-5">
                  <Skeleton className="h-48 w-full" />
                </section>
                <Separator />
                <section className="p-4 sm:p-5">
                  <Skeleton className="h-56 w-full" />
                </section>
              </>
            ))
            .with(
              { membership: { role: ORGANIZATION_ROLES.OWNER } },
              ({ organization }) => (
                <>
                  <OrganizationProfileForm organization={organization} />
                  <Separator />
                  <OrganizationDangerZone
                    organization={organization}
                    team={team}
                  />
                </>
              )
            )
            .otherwise(({ organization }) => (
              <OrganizationProfileReadonly organization={organization} />
            ))}
        </Card>
      </div>
    </div>
  )
}
