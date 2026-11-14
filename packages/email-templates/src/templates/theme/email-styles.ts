/** Hex equivalents of the `@workspace/ui` theme tokens; email clients do not support `oklch`. */
export const EMAIL_STYLES = {
  card: "#ffffff",
  foreground: "#0a0a0a",
  mutedForeground: "#737373",
  border: "#e5e5e5",
  primary: "#171717",
  primaryForeground: "#fafafa",
  muted: "#f5f5f5",
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

/** Path of the email logo, served by the web app and by the preview server's `static` folder. */
export const EMAIL_LOGO_PATH = "/openstream-logo-email.png"

export const EMAIL_LOGO_SIZE = { width: 112, height: 43 } as const
