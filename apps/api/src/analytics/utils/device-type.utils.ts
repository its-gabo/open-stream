import { VIEWER_DEVICE_TYPES } from "@workspace/shared"

/** A rough device type from the browser's user agent; desktop when it says nothing else. */
export function detectDeviceType(userAgent: string | undefined) {
  if (!userAgent) return VIEWER_DEVICE_TYPES.DESKTOP

  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) {
    return VIEWER_DEVICE_TYPES.TABLET
  }

  return /Mobi|iPhone|iPod|Android/i.test(userAgent)
    ? VIEWER_DEVICE_TYPES.MOBILE
    : VIEWER_DEVICE_TYPES.DESKTOP
}
