import { isPrivateHost } from "./private-network.utils"

/**
 * Whether the server may send requests to a user-provided service address,
 * e.g. a storage endpoint or a transcription provider. Without
 * `allowPrivateNetwork`, only public HTTPS hosts are accepted, so a user
 * cannot point the server at itself or its internal network. Hostnames are
 * not resolved, so this does not stop DNS that points at private addresses.
 */
export const isAllowedServiceEndpoint = (
  endpoint: string,
  { allowPrivateNetwork }: { allowPrivateNetwork: boolean }
): boolean => {
  const url = URL.parse(endpoint)

  if (!url || url.username || url.password) return false
  if (allowPrivateNetwork) return ["http:", "https:"].includes(url.protocol)

  return url.protocol === "https:" && !isPrivateHost(url.hostname)
}
