export const STATE_CHANGING_ROUTES = [
  "/auth/sign-up/email",
  "/auth/sign-in/email",
  "/auth/sign-out",
  "/auth/forgot-password",
  "/auth/reset-password",
] as const

export const FOREIGN_ORIGINS = [
  { description: "another origin", headers: { origin: "https://evil.test" } },
  { description: "no origin", headers: { origin: "" } },
  {
    description: "the web origin over plain HTTP",
    headers: { origin: "http://app.openstream.test" },
  },
] as const
