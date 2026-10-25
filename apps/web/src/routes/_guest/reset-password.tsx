import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { LockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthenticationLayout } from "@/layouts/authentication-layout"
import { createPageMeta } from "@/lib/page-meta"
import { resetPasswordSearchSchema } from "@/modules/auth/auth.schemas"
import { MissingTokenAlert } from "@/modules/auth/components/missing-token-alert"
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form"

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Choose a new password",
      description:
        "Use the link from your email to set a new password and return to sign in.",
    }),
  }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = Route.useSearch()

  const handleResetPasswordSuccess = () => {
    void navigate({
      to: "/sign-in",
      search: { redirectTo: undefined },
      replace: true,
    })
  }

  return (
    <AuthenticationLayout
      icon={<LockIcon className="size-6" />}
      title={t("pages.reset_password.title")}
      description={t("pages.reset_password.description")}
      footer={
        <p className="text-sm leading-6 text-muted-foreground">
          <Link
            to="/sign-in"
            search={{ redirectTo: undefined }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("pages.reset_password.back_to_sign_in")}
          </Link>
        </p>
      }
    >
      {token ? (
        <ResetPasswordForm
          token={token}
          onSuccess={handleResetPasswordSuccess}
        />
      ) : (
        <MissingTokenAlert message={t("pages.reset_password.missing_token")} />
      )}
    </AuthenticationLayout>
  )
}
