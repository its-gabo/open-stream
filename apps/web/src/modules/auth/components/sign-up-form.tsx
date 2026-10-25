import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { signUpFormSchema } from "../auth.schemas"
import { SubmitButtonIcon } from "./submit-button-icon"

import type { SignUpFormValues } from "../auth.types"

import { useAuthSignUpMutation } from "@/api/mutations/auth/useAuthSignUpMutation"
import { getFormFields } from "@/lib/get-form-fields"

type SignUpFormProps = {
  onSuccess: () => void
  redirectTo?: string
}

export function SignUpForm({ onSuccess, redirectTo }: SignUpFormProps) {
  const { t } = useTranslation()
  const schema = signUpFormSchema(t)

  const form = useForm<SignUpFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { mutate: signUp, isPending: isSignUpPending } = useAuthSignUpMutation({
    onSuccess,
  })

  const handleOnSubmit = ({ name, email, password }: SignUpFormValues) =>
    signUp({ name, email, password, redirectTo })

  const formFields = getFormFields(schema)

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(handleOnSubmit)(event)
      }}
      autoComplete="off"
    >
      <FormFieldRenderer
        control={form.control}
        errors={form.formState.errors}
        fields={formFields}
      />
      <Button type="submit" className="w-full" disabled={isSignUpPending}>
        {t("pages.sign_up.submit")}
        <SubmitButtonIcon isPending={isSignUpPending} />
      </Button>
    </form>
  )
}
