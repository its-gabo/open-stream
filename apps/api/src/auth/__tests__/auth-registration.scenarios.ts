const VALID_SIGN_UP = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  password: "correct-horse-battery",
}

export const REJECTED_SIGN_UPS = [
  { description: "an invalid email", body: { ...VALID_SIGN_UP, email: "ada" } },
  {
    description: "a password shorter than 8 characters",
    body: { ...VALID_SIGN_UP, password: "short" },
  },
  {
    description: "a password longer than 128 characters",
    body: { ...VALID_SIGN_UP, password: "p".repeat(129) },
  },
  { description: "a blank name", body: { ...VALID_SIGN_UP, name: "   " } },
  {
    description: "a name longer than 100 characters",
    body: { ...VALID_SIGN_UP, name: "n".repeat(101) },
  },
  {
    description: "a protocol-relative redirect",
    body: { ...VALID_SIGN_UP, redirectTo: "//evil.test" },
  },
  {
    description: "an absolute redirect URL",
    body: { ...VALID_SIGN_UP, redirectTo: "https://evil.test/videos" },
  },
] as const

export { VALID_SIGN_UP }
