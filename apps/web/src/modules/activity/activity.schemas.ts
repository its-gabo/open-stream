import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import { z } from "zod"

import { listPageSearchSchema } from "@/modules/pagination/pagination.schemas"

/** The activity page's URL search: page, search and the kind of resource shown. */
export const activitySearchSchema = listPageSearchSchema.extend({
  resourceType: z.enum(ACTIVITY_RESOURCE_TYPES).optional().catch(undefined),
})
