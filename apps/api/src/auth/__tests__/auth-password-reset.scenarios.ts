export const REJECTED_RESET_REQUESTS = [
  {
    description: "a malformed token",
    body: { token: "not-a-token", password: "a-brand-new-password" },
  },
  {
    description: "a password shorter than 8 characters",
    body: { token: "a".repeat(64), password: "short" },
  },
] as const
