import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTOR_KINDS,
  ACTIVITY_RESOURCE_TYPES,
} from "@workspace/shared"
import { z } from "zod"
import {
  paginationDtoSchema,
  paginationQuerySchema,
} from "../../common/http/pagination/pagination.schemas"
import { createApiSuccessResponseSchema } from "../../common/http/response/response.schemas"

const activityResourceTypeSchema = z
  .enum(ACTIVITY_RESOURCE_TYPES)
  .meta({ id: "ActivityResourceType" })

/** A page of activity; `search` matches the actor, the resource's name and the action. */
export const activityListQuerySchema = paginationQuerySchema.extend({
  resourceType: activityResourceTypeSchema.optional(),
  resourceId: z.string().max(64).optional(),
  actorUserId: z.uuid().optional(),
})

const activityValuesSchema = z.record(z.string(), z.unknown())

export const activityLogDtoSchema = z
  .object({
    id: z.uuid(),
    action: z.enum(ACTIVITY_ACTIONS).meta({ id: "ActivityAction" }),
    actor: z.object({
      kind: z.enum(ACTIVITY_ACTOR_KINDS).meta({ id: "ActivityActorKind" }),
      /** Null for API keys, and once the member's account is deleted. */
      userId: z.uuid().nullable(),
      apiKeyId: z.uuid().nullable(),
      /** The member's name and email, or the key's name, as they were then. */
      label: z.string(),
    }),
    resource: z.object({
      type: activityResourceTypeSchema,
      id: z.string().nullable(),
      /** E.g. the video's title, as it was then. */
      label: z.string().nullable(),
    }),
    /** Changed fields as they were; null when the resource was created. */
    before: activityValuesSchema.nullable(),
    /** Changed fields as they became; null when the resource was removed. */
    after: activityValuesSchema.nullable(),
    context: activityValuesSchema,
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: "ActivityLog" })

export const activityLogPageSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({
      activities: z.array(activityLogDtoSchema),
      pagination: paginationDtoSchema,
    })
  ).meta({ id: "ActivityLogPageSuccessResponse" })

export type ActivityListQuery = z.infer<typeof activityListQuerySchema>
export type ActivityLogDto = z.infer<typeof activityLogDtoSchema>
