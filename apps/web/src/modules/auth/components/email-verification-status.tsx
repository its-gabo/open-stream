import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { CircleCheckIcon, CircleXIcon, LoaderCircleIcon } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { useAuthVerifyEmailQuery } from "@/api/queries/auth/useAuthVerifyEmailQuery"
import { useApiToast } from "@/hooks/use-api-toast"
import { EMAIL_VERIFICATION_STATE } from "@/modules/auth/auth.constants"

type EmailVerificationStatusProps = {
  token?: string
}

export function EmailVerificationStatus({
  token,
}: EmailVerificationStatusProps) {
  const { t } = useTranslation()
  const { showSuccessToast, showErrorToast } = useApiToast()

  const {
    data: verifyEmailResponse,
    error: verifyEmailError,
    isPending: isVerifyEmailPending,
    isSuccess: isVerifyEmailSuccess,
  } = useAuthVerifyEmailQuery(token)

  useEffect(() => {
    if (isVerifyEmailSuccess) showSuccessToast(verifyEmailResponse)
  }, [isVerifyEmailSuccess, showSuccessToast, verifyEmailResponse])

  useEffect(() => {
    if (verifyEmailError) showErrorToast(verifyEmailError)
  }, [showErrorToast, verifyEmailError])

  const verificationState = match({
    hasToken: Boolean(token),
    isPending: isVerifyEmailPending,
    isSuccess: isVerifyEmailSuccess,
  })
    .with({ hasToken: false }, () => ({
      state: EMAIL_VERIFICATION_STATE.ERROR,
      message: t("pages.verify_email.result.missing_token"),
    }))
    .with({ isPending: true }, () => ({
      state: EMAIL_VERIFICATION_STATE.PENDING,
      message: t("pages.verify_email.result.pending"),
    }))
    .with({ isSuccess: true }, () => ({
      state: EMAIL_VERIFICATION_STATE.SUCCESS,
      message: t("pages.verify_email.result.success"),
    }))
    .otherwise(() => ({
      state: EMAIL_VERIFICATION_STATE.ERROR,
      message: t("pages.verify_email.result.error"),
    }))

  return match(verificationState.state)
    .with(EMAIL_VERIFICATION_STATE.PENDING, () => (
      <Alert>
        <LoaderCircleIcon className="animate-spin" />
        <AlertDescription>{verificationState.message}</AlertDescription>
      </Alert>
    ))
    .with(EMAIL_VERIFICATION_STATE.SUCCESS, () => (
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>{t("pages.verify_email.alert.success_title")}</AlertTitle>
        <AlertDescription>{verificationState.message}</AlertDescription>
      </Alert>
    ))
    .with(EMAIL_VERIFICATION_STATE.ERROR, () => (
      <Alert variant="destructive">
        <CircleXIcon />
        <AlertTitle>{t("pages.verify_email.alert.error_title")}</AlertTitle>
        <AlertDescription>{verificationState.message}</AlertDescription>
      </Alert>
    ))
    .exhaustive()
}
