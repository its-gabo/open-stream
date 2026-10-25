import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { resetPasswordFormSchema } from "../auth.schemas"
import { SubmitButtonIcon } from "./submit-button-icon"

import type { ResetPasswordFormValues } from "../auth.types"

import { useAuthResetPasswordMutation } from "@/api/mutations/auth/useAuthResetPasswordMutation"
import { getFormFields } from "@/lib/get-form-fields"

type ResetPasswordFormProps = {
  token: string
  onSuccess: () => void
}

export function ResetPasswordForm({
  token,
  onSuccess,
}: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const schema = resetPasswordFormSchema(t)

  const form = useForm<ResetPasswordFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const { mutate: resetPassword, isPending: isResetPasswordPending } =
    useAuthResetPasswordMutation({ onSuccess })

  const handleOnSubmit = ({ password }: ResetPasswordFormValues) =>
    resetPassword({ token, password })

  const formFields = getFormFields(schema)

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(handleOnSubmit)(event)
      }}
    >
      <FormFieldRenderer
        control={form.control}
        errors={form.formState.errors}
        fields={formFields}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={isResetPasswordPending}
      >
        {t("pages.reset_password.submit")}
        <SubmitButtonIcon isPending={isResetPasswordPending} />
      </Button>
    </form>
  )
}
