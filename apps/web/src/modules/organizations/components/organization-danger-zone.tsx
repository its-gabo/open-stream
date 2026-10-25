import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { ORGANIZATION_ROLES } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import {
  LoaderCircleIcon,
  ShieldUserIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  organizationDeletionFormSchema,
  organizationTransferFormSchema,
} from "../organizations.schemas"

import type {
  OrganizationDetail,
  OrganizationTeam,
  OrganizationTeamMember,
} from "@/api/generated-api"
import type {
  OrganizationDeletionFormValues,
  OrganizationTransferFormValues,
} from "../organizations.types"

import { useOrganizationScheduleDeletionMutation } from "@/api/mutations/organizations/useOrganizationScheduleDeletionMutation"
import { useOrganizationTransferMutation } from "@/api/mutations/organizations/useOrganizationTransferMutation"
import { getFormFields } from "@/lib/get-form-fields"

type OrganizationDangerZoneProps = {
  organization: OrganizationDetail
  team?: OrganizationTeam
}

export function OrganizationDangerZone({
  organization,
  team,
}: OrganizationDangerZoneProps) {
  const { t } = useTranslation()
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isDeletionOpen, setIsDeletionOpen] = useState(false)
  const members =
    team?.members.filter(
      (member) => member.role === ORGANIZATION_ROLES.MEMBER
    ) ?? []

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <TriangleAlertIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("organizations.danger.title")}</CardTitle>
          <CardDescription>
            {t("organizations.danger.description")}
          </CardDescription>
        </div>
      </div>
      <div className="divide-y rounded-lg border border-destructive/30 p-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {t("organizations.danger.transfer_title")}
            </p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {t("organizations.danger.transfer_description")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsTransferOpen(true)}
            disabled={members.length === 0}
          >
            <ShieldUserIcon />
            {t("organizations.danger.transfer_action")}
          </Button>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-destructive">
              {t("organizations.danger.delete_title")}
            </p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {t("organizations.danger.delete_description")}
            </p>
          </div>
          <Button variant="destructive" onClick={() => setIsDeletionOpen(true)}>
            <Trash2Icon />
            {t("organizations.danger.delete_action")}
          </Button>
        </div>
      </div>

      <TransferOwnershipDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        organizationSlug={organization.slug}
        organizationName={organization.name}
        members={members}
      />
      <ScheduleDeletionDialog
        open={isDeletionOpen}
        onOpenChange={setIsDeletionOpen}
        organizationSlug={organization.slug}
        organizationName={organization.name}
      />
    </section>
  )
}

type DangerZoneDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationSlug: string
  organizationName: string
}

function TransferOwnershipDialog({
  open,
  onOpenChange,
  organizationSlug,
  organizationName,
  members,
}: DangerZoneDialogProps & { members: OrganizationTeamMember[] }) {
  const { t } = useTranslation()
  const schema = organizationTransferFormSchema(
    t,
    organizationName,
    members.map((member) => ({
      label: `${member.name} · ${member.email}`,
      value: member.membershipId,
    }))
  )

  const form = useForm<OrganizationTransferFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { membershipId: "", organizationName: "" },
  })

  const { mutate: transferOwnership, isPending: isTransferPending } =
    useOrganizationTransferMutation(organizationSlug, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })

  const handleOnSubmit = (values: OrganizationTransferFormValues) =>
    transferOwnership(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("organizations.danger.transfer_dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {t("organizations.danger.transfer_dialog_description")}
          </DialogDescription>
        </DialogHeader>
        <form
          id="transfer-ownership-form"
          className="space-y-4"
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
            {t("organizations.danger.transfer_warning")}
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="transfer-ownership-form"
            disabled={isTransferPending || !form.formState.isValid}
          >
            {isTransferPending && <LoaderCircleIcon className="animate-spin" />}
            {t("organizations.danger.transfer_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScheduleDeletionDialog({
  open,
  onOpenChange,
  organizationSlug,
  organizationName,
}: DangerZoneDialogProps) {
  const { t } = useTranslation()
  const schema = organizationDeletionFormSchema(t, organizationName)

  const form = useForm<OrganizationDeletionFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { organizationName: "", confirmationPhrase: "" },
  })

  const { mutate: scheduleDeletion, isPending: isSchedulePending } =
    useOrganizationScheduleDeletionMutation(organizationSlug, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })

  const handleOnSubmit = (values: OrganizationDeletionFormValues) =>
    scheduleDeletion(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            {t("organizations.danger.delete_dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {t("organizations.danger.delete_dialog_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm leading-6">
          {t("organizations.danger.delete_email_explanation")}
        </div>
        <form
          id="schedule-deletion-form"
          className="space-y-4"
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
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            type="submit"
            form="schedule-deletion-form"
            disabled={isSchedulePending || !form.formState.isValid}
          >
            {isSchedulePending && <LoaderCircleIcon className="animate-spin" />}
            {t("organizations.danger.delete_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
