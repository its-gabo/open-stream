import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InfoIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import type { OrganizationSummary } from "@/api/generated-api"

import { useOrganizationContextQuery } from "@/api/queries/organizations/useOrganizationContextQuery"
import { createPageMeta } from "@/lib/page-meta"
import { OrganizationCreateForm } from "@/modules/organizations/components/organization-create-form"
import { OrganizationGatewayShell } from "@/modules/organizations/components/organization-gateway-shell"

export const Route = createFileRoute("/_authenticated/organizations/new")({
  head: () => ({
    meta: createPageMeta({
      title: "Create organization",
      description: "Choose the name and URL of your new workspace.",
    }),
  }),
  component: OrganizationsNewRoute,
})

function OrganizationsNewRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: context, isPending } = useOrganizationContextQuery()

  const handleCreateSuccess = (organization: OrganizationSummary) => {
    void navigate({
      to: "/$organizationSlug",
      params: { organizationSlug: organization.slug },
      replace: true,
    })
  }

  return (
    <OrganizationGatewayShell
      activePage="new-organization"
      title={t("organizations.create.title")}
      hasMemberships={Boolean(context?.memberships.length)}
    >
      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-4 sm:px-6">
          <CardTitle>{t("organizations.create.form_title")}</CardTitle>
          <CardDescription>
            {t("organizations.create.form_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
          {match({ context, isPending })
            .with(
              { context: { membershipLimit: { reached: true } } },
              ({ context: { membershipLimit } }) => (
                <Alert>
                  <InfoIcon className="size-4" />
                  <AlertTitle>
                    {t("organizations.create.limit_title")}
                  </AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>
                      {t("organizations.create.limit_description", {
                        count: membershipLimit.maximum,
                      })}
                    </p>
                    <Link
                      to="/"
                      className="inline-flex font-medium text-foreground underline underline-offset-4"
                    >
                      {t("organizations.create.back_to_workspace")}
                    </Link>
                  </AlertDescription>
                </Alert>
              )
            )
            .with({ isPending: true }, () => (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1].map((item) => (
                    <div key={item} className="space-y-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-8 animate-pulse rounded-lg bg-muted" />
                    </div>
                  ))}
                </div>
                <div className="h-12 animate-pulse rounded-lg bg-muted" />
              </div>
            ))
            .otherwise(() => (
              <OrganizationCreateForm onSuccess={handleCreateSuccess} />
            ))}
        </CardContent>
      </Card>
    </OrganizationGatewayShell>
  )
}
