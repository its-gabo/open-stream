import { isPrivateHost } from "../../common/network/private-network.utils"

/**
 * Whether deliveries may be sent to a webhook URL. Without
 * `allowPrivateNetwork`, only public HTTPS hosts are accepted, so a webhook
 * cannot point the server at itself or its internal network; the host is
 * resolved again before every delivery.
 */
export const isAllowedWebhookUrl = (
  value: string,
  { allowPrivateNetwork }: { allowPrivateNetwork: boolean }
) => {
  const url = URL.parse(value)

  if (!url || url.username || url.password) return false
  if (allowPrivateNetwork) return ["http:", "https:"].includes(url.protocol)

  return url.protocol === "https:" && !isPrivateHost(url.hostname)
}
