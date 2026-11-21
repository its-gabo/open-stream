import { isAllowedServiceEndpoint } from "../../common/network/service-endpoint.utils"

/** Whether the API may send requests to a user-provided storage endpoint; see `isAllowedServiceEndpoint`. */
export const isAllowedStorageEndpoint = isAllowedServiceEndpoint
