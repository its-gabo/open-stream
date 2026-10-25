import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { BuildingIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { OrganizationDetail } from "@/api/generated-api"

type OrganizationProfileReadonlyProps = {
  organization: OrganizationDetail
}

export function OrganizationProfileReadonly({
  organization,
}: OrganizationProfileReadonlyProps) {
  const { t } = useTranslation()
  const values = [
    [t("organizations.fields.name"), organization.name],
    [t("organizations.fields.slug"), `/${organization.slug}`],
  ]

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BuildingIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("organizations.profile.title")}</CardTitle>
          <CardDescription>
            {t("organizations.profile.readonly_description")}
          </CardDescription>
        </div>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {values.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </dt>
            <dd className="mt-1 text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
