import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { LoaderCircleIcon, SendIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { organizationInviteFormSchema } from "../organizations.schemas"

import type { OrganizationInviteFormValues } from "../organizations.types"

import { useOrganizationInviteMutation } from "@/api/mutations/organizations/useOrganizationInviteMutation"
import { getFormFields } from "@/lib/get-form-fields"

type OrganizationInviteFormProps = {
  organizationSlug: string
}

export function OrganizationInviteForm({
  organizationSlug,
}: OrganizationInviteFormProps) {
  const { t } = useTranslation()
  const schema = organizationInviteFormSchema(t)

  const form = useForm<OrganizationInviteFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { email: "" },
  })

  const { mutate: inviteMember, isPending: isInvitePending } =
    useOrganizationInviteMutation(organizationSlug, {
      onSuccess: () => form.reset(),
    })

  const handleOnSubmit = (values: OrganizationInviteFormValues) =>
    inviteMember(values)

  return (
    <form
      className="flex flex-col items-end gap-3 sm:flex-row [&>div]:w-full"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(handleOnSubmit)(event)
      }}
    >
      <FormFieldRenderer
        control={form.control}
        errors={form.formState.errors}
        fields={getFormFields(schema)}
      />
      <Button type="submit" className="shrink-0" disabled={isInvitePending}>
        {isInvitePending ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <SendIcon />
        )}
        {t("organizations.team.invite")}
      </Button>
    </form>
  )
}
