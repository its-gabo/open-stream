import type { z } from "zod"

import type {
  organizationCreateFormSchema,
  organizationDeletionFormSchema,
  organizationInviteFormSchema,
  organizationProfileFormSchema,
  organizationTransferFormSchema,
} from "./organizations.schemas"
import type {
  ORGANIZATION_DELETION_ACTION_STATES,
  ORGANIZATION_DELETION_ACTIONS,
} from "./organizations.constants"

export type OrganizationCreateFormValues = z.infer<
  ReturnType<typeof organizationCreateFormSchema>
>
export type OrganizationProfileFormValues = z.infer<
  ReturnType<typeof organizationProfileFormSchema>
>
export type OrganizationInviteFormValues = z.infer<
  ReturnType<typeof organizationInviteFormSchema>
>
export type OrganizationTransferFormValues = z.infer<
  ReturnType<typeof organizationTransferFormSchema>
>
export type OrganizationDeletionFormValues = z.infer<
  ReturnType<typeof organizationDeletionFormSchema>
>

export type OrganizationDeletionAction =
  (typeof ORGANIZATION_DELETION_ACTIONS)[keyof typeof ORGANIZATION_DELETION_ACTIONS]

export type OrganizationDeletionActionState =
  (typeof ORGANIZATION_DELETION_ACTION_STATES)[keyof typeof ORGANIZATION_DELETION_ACTION_STATES]
