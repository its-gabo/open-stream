import { isPrivateHost } from "../../common/network/private-network.utils"

/**
 * Whether the API may send requests to a user-provided storage endpoint.
 * Without `allowPrivateNetwork`, only public HTTPS hosts are accepted, so a
 * custom storage cannot point the server at itself or its internal network.
 * Hostnames are not resolved, so this does not stop DNS that points at
 * private addresses.
 */
export const isAllowedStorageEndpoint = (
  endpoint: string,
  { allowPrivateNetwork }: { allowPrivateNetwork: boolean }
): boolean => {
  const url = URL.parse(endpoint)

  if (!url || url.username || url.password) return false
  if (allowPrivateNetwork) return ["http:", "https:"].includes(url.protocol)

  return url.protocol === "https:" && !isPrivateHost(url.hostname)
}
