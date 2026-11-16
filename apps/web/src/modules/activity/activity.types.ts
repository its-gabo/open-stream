import type { ActivityResourceType } from "@workspace/shared"

import type { ListPageParams } from "@/modules/pagination/pagination.types"

export type ActivityListParams = ListPageParams & {
  resourceType?: ActivityResourceType
}
