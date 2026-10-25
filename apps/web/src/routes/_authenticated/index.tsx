import { createFileRoute, redirect } from "@tanstack/react-router"

import { organizationContextQueryOptions } from "@/api/queries/organizations/useOrganizationContextQuery"

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async ({ context }) => {
    const { memberships, pendingInvitations } =
      await context.queryClient.fetchQuery(organizationContextQueryOptions)
    const lastSelected = memberships.at(0)

    if (lastSelected) {
      throw redirect({
        to: "/$organizationSlug",
        params: { organizationSlug: lastSelected.organization.slug },
        replace: true,
      })
    }

    if (pendingInvitations.length > 0) {
      throw redirect({
        to: "/inbox",
        search: { invitationId: undefined },
        replace: true,
      })
    }

    throw redirect({ to: "/organizations/new", replace: true })
  },
})
