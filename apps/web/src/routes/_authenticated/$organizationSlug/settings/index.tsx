import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/settings/"
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$organizationSlug/settings/organization",
      params,
      replace: true,
    })
  },
})
