export const REJECTED_SIGN_INS = [
  { description: "a wrong password", body: { password: "wrong-password" } },
  {
    description: "an unknown email",
    body: { email: "nobody@example.test" },
  },
] as const

export const INVALID_SESSION_COOKIES = [
  { description: "no cookie", cookie: undefined },
  {
    description: "a malformed token",
    cookie: "openstream_session=not-a-token",
  },
  {
    description: "a well-formed but unknown token",
    cookie: `openstream_session=${"a".repeat(64)}`,
  },
] as const
