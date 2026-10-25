import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useNavigate } from "@tanstack/react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import {
  BuildingIcon,
  CircleAlertIcon,
  LinkIcon,
  LoaderCircleIcon,
  SaveIcon,
} from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { organizationProfileFormSchema } from "../organizations.schemas"

import type { OrganizationDetail } from "@/api/generated-api"
import type { OrganizationProfileFormValues } from "../organizations.types"

import { useOrganizationUpdateMutation } from "@/api/mutations/organizations/useOrganizationUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type OrganizationProfileFormProps = {
  organization: OrganizationDetail
}

export function OrganizationProfileForm({
  organization,
}: OrganizationProfileFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pendingValues, setPendingValues] =
    useState<OrganizationProfileFormValues | null>(null)
  const schema = organizationProfileFormSchema(t)

  const form = useForm<OrganizationProfileFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { name: organization.name, slug: organization.slug },
  })

  const { mutate: updateOrganization, isPending: isUpdatePending } =
    useOrganizationUpdateMutation(organization.slug, {
      onSuccess: (updatedOrganization) => {
        setPendingValues(null)
        form.reset({
          name: updatedOrganization.name,
          slug: updatedOrganization.slug,
        })

        if (updatedOrganization.slug === organization.slug) return

        void navigate({
          to: "/$organizationSlug/settings/organization",
          params: { organizationSlug: updatedOrganization.slug },
          replace: true,
        })
      },
    })

  const handleOnSubmit = (values: OrganizationProfileFormValues) => {
    if (values.slug !== organization.slug) {
      setPendingValues(values)
      return
    }

    updateOrganization(values)
  }

  return (
    <>
      <section className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BuildingIcon className="size-5" />
          </span>
          <div>
            <CardTitle>{t("organizations.profile.title")}</CardTitle>
            <CardDescription>
              {t("organizations.profile.description")}
            </CardDescription>
          </div>
        </div>
        <form
          id="organization-profile-form"
          className="grid gap-x-6 gap-y-2 sm:grid-cols-2 [&>div]:contents"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit(handleOnSubmit)(event)
          }}
        >
          <FormFieldRenderer
            className="space-y-2"
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
        </form>
        <div className="flex justify-end">
          <Button
            type="submit"
            form="organization-profile-form"
            disabled={isUpdatePending || !form.formState.isDirty}
          >
            {isUpdatePending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("organizations.profile.save")}
          </Button>
        </div>
      </section>

      <AlertDialog
        open={Boolean(pendingValues)}
        onOpenChange={(open) => {
          if (!open) setPendingValues(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <LinkIcon className="size-5" />
            </span>
            <AlertDialogTitle>
              {t("organizations.profile.slug_change_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.profile.slug_change_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs">
            /{organization.slug} → /{pendingValues?.slug}
          </div>
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <CircleAlertIcon className="size-4" />
            <AlertDescription>
              {t("organizations.profile.slug_change_warning")}
            </AlertDescription>
          </Alert>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdatePending}
              onClick={() => {
                if (pendingValues) updateOrganization(pendingValues)
              }}
            >
              {isUpdatePending && <LoaderCircleIcon className="animate-spin" />}
              {t("organizations.profile.confirm_slug_change")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
