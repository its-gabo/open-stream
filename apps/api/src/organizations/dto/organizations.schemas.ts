import {
  AUTH_FIELD_LIMITS,
  authTokenSchema,
  ORGANIZATION_FIELD_LIMITS,
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_ROLES,
  ORGANIZATION_STATUSES,
  organizationNameSchema,
  organizationSlugSchema,
} from "@workspace/shared"
import { z } from "zod"
import {
  apiEmptyDataSchema,
  createApiSuccessResponseSchema,
} from "../../common/http/response/response.schemas"

/** Confirmations are compared to the stored name, so they are only bounded here. */
const organizationNameConfirmationSchema = z
  .string()
  .max(ORGANIZATION_FIELD_LIMITS.NAME_MAX_LENGTH)

export const organizationCreateBodySchema = z
  .object({ name: organizationNameSchema, slug: organizationSlugSchema })
  .meta({ id: "OrganizationCreateBody" })

export const organizationUpdateBodySchema = z
  .object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
  })
  .refine((body) => body.name !== undefined || body.slug !== undefined)
  .meta({ id: "OrganizationUpdateBody" })

export const organizationSlugSuggestionQuerySchema = z.object({
  name: z.string().trim().min(1).max(ORGANIZATION_FIELD_LIMITS.NAME_MAX_LENGTH),
})

export const organizationInvitationCreateBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email().max(AUTH_FIELD_LIMITS.EMAIL_MAX_LENGTH)),
  })
  .meta({ id: "OrganizationInvitationCreateBody" })

export const organizationOwnershipTransferBodySchema = z
  .object({
    membershipId: z.uuid(),
    organizationName: organizationNameConfirmationSchema,
  })
  .meta({ id: "OrganizationOwnershipTransferBody" })

export const organizationDeletionScheduleBodySchema = z
  .object({
    organizationName: organizationNameConfirmationSchema,
    confirmationPhrase: z.string().max(100),
  })
  .meta({ id: "OrganizationDeletionScheduleBody" })

export const organizationDeletionActionBodySchema = z
  .object({ token: authTokenSchema })
  .meta({ id: "OrganizationDeletionActionBody" })

export const organizationParamSchema = z.object({
  organizationSlug: z.string(),
})

export const organizationInvitationParamSchema = z.object({
  invitationId: z.uuid(),
})

export const organizationTeamInvitationParamSchema = z.object({
  organizationSlug: z.string(),
  invitationId: z.uuid(),
})

export const organizationTeamMemberParamSchema = z.object({
  organizationSlug: z.string(),
  membershipId: z.uuid(),
})

const organizationRoleSchema = z
  .enum(ORGANIZATION_ROLES)
  .meta({ id: "OrganizationRole" })

const organizationStatusSchema = z
  .enum(ORGANIZATION_STATUSES)
  .meta({ id: "OrganizationStatus" })

const organizationTeamInvitationStatusSchema = z
  .enum([
    ORGANIZATION_INVITATION_STATUSES.PENDING,
    ORGANIZATION_INVITATION_STATUSES.EXPIRED,
  ])
  .meta({ id: "OrganizationTeamInvitationStatus" })

export const organizationSummaryDtoSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    status: organizationStatusSchema,
    scheduledDeletionAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "OrganizationSummary" })

export const organizationMembershipDtoSchema = z
  .object({ membershipId: z.uuid(), role: organizationRoleSchema })
  .meta({ id: "OrganizationMembership" })

export const organizationContextDtoSchema = z
  .object({
    /** Most recently selected first. */
    memberships: z.array(
      organizationMembershipDtoSchema.extend({
        organization: organizationSummaryDtoSchema,
      })
    ),
    pendingInvitations: z.array(
      z.object({
        invitationId: z.uuid(),
        expiresAt: z.iso.datetime(),
        organization: organizationSummaryDtoSchema,
      })
    ),
    membershipLimit: z.object({
      used: z.int().nonnegative(),
      maximum: z.int().positive(),
      reached: z.boolean(),
    }),
  })
  .meta({ id: "OrganizationContext" })

export const organizationDetailDtoSchema = organizationSummaryDtoSchema
  .extend({ createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() })
  .meta({ id: "OrganizationDetail" })

export const organizationTeamMemberDtoSchema = z
  .object({
    membershipId: z.uuid(),
    userId: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: organizationRoleSchema,
  })
  .meta({ id: "OrganizationTeamMember" })

export const organizationTeamInvitationDtoSchema = z
  .object({
    invitationId: z.uuid(),
    email: z.email(),
    status: organizationTeamInvitationStatusSchema,
    expiresAt: z.iso.datetime(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: "OrganizationTeamInvitation" })

export const organizationTeamDtoSchema = z
  .object({
    members: z.array(organizationTeamMemberDtoSchema),
    /** Pending and expired invitations; only the owner sees them. */
    invitations: z.array(organizationTeamInvitationDtoSchema),
  })
  .meta({ id: "OrganizationTeam" })

export const organizationEmptySuccessResponseSchema =
  createApiSuccessResponseSchema(apiEmptyDataSchema).meta({
    id: "OrganizationEmptySuccessResponse",
  })

export const organizationContextSuccessResponseSchema =
  createApiSuccessResponseSchema(organizationContextDtoSchema).meta({
    id: "OrganizationContextSuccessResponse",
  })

export const organizationSlugSuggestionSuccessResponseSchema =
  createApiSuccessResponseSchema(z.object({ slug: z.string() })).meta({
    id: "OrganizationSlugSuggestionSuccessResponse",
  })

export const organizationCreateSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      organization: organizationSummaryDtoSchema,
      membership: organizationMembershipDtoSchema,
    })
  ).meta({ id: "OrganizationCreateSuccessResponse" })

export const organizationGetSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      organization: organizationDetailDtoSchema,
      membership: organizationMembershipDtoSchema,
    })
  ).meta({ id: "OrganizationGetSuccessResponse" })

export const organizationSummarySuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ organization: organizationSummaryDtoSchema })
  ).meta({ id: "OrganizationSummarySuccessResponse" })

export const organizationTeamSuccessResponseSchema =
  createApiSuccessResponseSchema(organizationTeamDtoSchema).meta({
    id: "OrganizationTeamSuccessResponse",
  })

export const organizationInvitationSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ invitation: organizationTeamInvitationDtoSchema })
  ).meta({ id: "OrganizationInvitationSuccessResponse" })

export type OrganizationCreateBody = z.infer<
  typeof organizationCreateBodySchema
>
export type OrganizationUpdateBody = z.infer<
  typeof organizationUpdateBodySchema
>
export type OrganizationInvitationCreateBody = z.infer<
  typeof organizationInvitationCreateBodySchema
>
export type OrganizationOwnershipTransferBody = z.infer<
  typeof organizationOwnershipTransferBodySchema
>
export type OrganizationDeletionScheduleBody = z.infer<
  typeof organizationDeletionScheduleBodySchema
>
export type OrganizationSummaryDto = z.infer<
  typeof organizationSummaryDtoSchema
>
export type OrganizationMembershipDto = z.infer<
  typeof organizationMembershipDtoSchema
>
export type OrganizationContextDto = z.infer<
  typeof organizationContextDtoSchema
>
export type OrganizationDetailDto = z.infer<typeof organizationDetailDtoSchema>
export type OrganizationTeamDto = z.infer<typeof organizationTeamDtoSchema>
export type OrganizationTeamInvitationDto = z.infer<
  typeof organizationTeamInvitationDtoSchema
>
