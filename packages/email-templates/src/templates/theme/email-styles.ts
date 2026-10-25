/** Hex equivalents of the `@workspace/ui` theme tokens; email clients do not support `oklch`. */
export const EMAIL_STYLES = {
  card: "#ffffff",
  foreground: "#09090b",
  mutedForeground: "#71717b",
  border: "#e4e4e7",
  primary: "#007a55",
  primaryForeground: "#ecfdf5",
  muted: "#f4f4f5",
  primarySoft: "#d0fae7",
  radius: "10px",
} as const

export const EMAIL_FONTS = {
  IMPORT_URL:
    "https://fonts.googleapis.com/css2?family=Oxanium:wght@600..800&family=Space+Grotesk:wght@300..700&display=swap",
  BODY: "'Space Grotesk', 'Segoe UI', Arial, sans-serif",
  HEADING: "Oxanium, 'Segoe UI', Arial, sans-serif",
  MONO: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const

export const EMAIL_BRAND_NAME = "OpenStream"
