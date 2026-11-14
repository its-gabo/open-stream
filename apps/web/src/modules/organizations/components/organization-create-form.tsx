import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ORGANIZATION_SLUG_SUGGESTION_DEBOUNCE_MS } from "../organizations.constants"
import { organizationCreateFormSchema } from "../organizations.schemas"

import type { OrganizationSummary } from "@/api/generated-api"
import type { OrganizationCreateFormValues } from "../organizations.types"

import { useOrganizationCreateMutation } from "@/api/mutations/organizations/useOrganizationCreateMutation"
import { useOrganizationSlugSuggestionQuery } from "@/api/queries/organizations/useOrganizationSlugSuggestionQuery"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { getFormFields } from "@/lib/get-form-fields"
import { SubmitButtonIcon } from "@/modules/auth/components/submit-button-icon"

type OrganizationCreateFormProps = {
  onSuccess: (organization: OrganizationSummary) => void
}

export function OrganizationCreateForm({
  onSuccess,
}: OrganizationCreateFormProps) {
  const { t } = useTranslation()
  const schema = organizationCreateFormSchema(t)

  const form = useForm<OrganizationCreateFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", slug: "" },
  })

  const name = useWatch({ control: form.control, name: "name" })
  const debouncedName = useDebouncedValue(
    name,
    ORGANIZATION_SLUG_SUGGESTION_DEBOUNCE_MS
  )
  const { data: suggestedSlug } =
    useOrganizationSlugSuggestionQuery(debouncedName)
  const isSlugEdited = Boolean(form.formState.dirtyFields.slug)

  useEffect(() => {
    if (suggestedSlug && !isSlugEdited) {
      form.setValue("slug", suggestedSlug, { shouldValidate: true })
    }
  }, [form, isSlugEdited, suggestedSlug])

  const { mutate: createOrganization, isPending: isCreatePending } =
    useOrganizationCreateMutation({ onSuccess })

  const handleOnSubmit = (values: OrganizationCreateFormValues) =>
    createOrganization(values)

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(handleOnSubmit)(event)
      }}
    >
      <FormFieldRenderer
        className="grid gap-4 space-y-0 sm:grid-cols-2"
        control={form.control}
        errors={form.formState.errors}
        fields={getFormFields(schema)}
      />
      <div className="-mx-5 flex justify-end border-t px-5 pt-5 sm:-mx-6 sm:px-6">
        <Button type="submit" disabled={isCreatePending}>
          {t("organizations.create.submit")}
          <SubmitButtonIcon isPending={isCreatePending} />
        </Button>
      </div>
    </form>
  )
}
