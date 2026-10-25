import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { createPageMeta } from "@/lib/page-meta"
import { APP_NAME } from "@/lib/page-meta.constants"
import { SignOutButton } from "@/modules/auth/components/sign-out-button"

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: createPageMeta({
      title: APP_NAME,
      description: APP_NAME,
    }),
  }),
  component: HomeRoute,
})

function HomeRoute() {
  const { t } = useTranslation()
  const { user } = Route.useRouteContext()

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("pages.home.title", { name: user.name })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pages.home.signed_in_as", { email: user.email })}
          </p>
        </div>
        <div>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
