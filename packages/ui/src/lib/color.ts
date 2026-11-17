/** A color as hue (0–360), saturation and value (0–1), the axes a color picker drags along. */
export type HsvColor = { h: number; s: number; v: number }

const HEX_COLOR_PATTERN = /^#?([0-9a-f]{6})$/i

/** `#rrggbb` in lowercase, or null when `value` is not a six-digit hex color. */
export function normalizeHexColor(value: string) {
  const match = HEX_COLOR_PATTERN.exec(value.trim())

  return match ? `#${match[1].toLowerCase()}` : null
}

/** Which sixth of the color wheel the color is in, measured from red. */
function toHueSector(
  r: number,
  g: number,
  b: number,
  max: number,
  delta: number
) {
  if (delta === 0) return 0
  if (max === r) return ((g - b) / delta) % 6
  if (max === g) return (b - r) / delta + 2

  return (r - g) / delta + 4
}

export function hexToHsv(hex: string): HsvColor {
  const channels = [1, 3, 5].map(
    (start) => parseInt(hex.slice(start, start + 2), 16) / 255
  )
  const [r, g, b] = channels as [number, number, number]
  const max = Math.max(r, g, b)
  const delta = max - Math.min(r, g, b)
  const hueSector = toHueSector(r, g, b, max, delta)

  return {
    h: (hueSector * 60 + 360) % 360,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

export function hsvToHex({ h, s, v }: HsvColor) {
  const channel = (offset: number) => {
    const k = (offset + h / 60) % 6

    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }

  return `#${[channel(5), channel(3), channel(1)]
    .map((value) =>
      Math.round(value * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`
}

/** True when dark marks read better than light ones on top of the color. */
export function isLightColor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) =>
    parseInt(hex.slice(start, start + 2), 16)
  ) as [number, number, number]

  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}
