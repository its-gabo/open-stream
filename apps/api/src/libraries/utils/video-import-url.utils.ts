import { VIDEO_FIELD_LIMITS } from "@workspace/shared"
import { isPrivateHost } from "../../common/network/private-network.utils"

/**
 * Whether a file may be imported from a URL: HTTP or HTTPS without
 * credentials and, without `allowPrivateNetwork`, not on the server itself
 * or its private network. The host is resolved again when it is connected to.
 */
export const isAllowedImportUrl = (
  value: string,
  { allowPrivateNetwork }: { allowPrivateNetwork: boolean }
) => {
  const url = URL.parse(value)

  if (!url || url.username || url.password) return false
  if (!["http:", "https:"].includes(url.protocol)) return false

  return allowPrivateNetwork || !isPrivateHost(url.hostname)
}

/** Shown instead of the whole URL, whose query may hold a token. */
export const importHostOf = (value: string | null) =>
  (value && URL.parse(value)?.host) || null

/** The last segment of the URL's path, e.g. `clip.mp4`; null when the path names no file. */
export const fileNameFromImportUrl = (value: string) => {
  const segment = URL.parse(value)?.pathname.split("/").at(-1) ?? ""
  let fileName = segment

  try {
    fileName = decodeURIComponent(segment)
  } catch {
    // A malformed escape keeps the segment as it was written.
  }

  return (
    fileName.trim().slice(0, VIDEO_FIELD_LIMITS.FILE_NAME_MAX_LENGTH) || null
  )
}
