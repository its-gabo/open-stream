export const REJECTED_ORGANIZATION_BODIES = [
  { description: "a blank name", body: { name: "   ", slug: "acme" } },
  {
    description: "a name longer than 120 characters",
    body: { name: "n".repeat(121), slug: "acme" },
  },
  { description: "a one-character slug", body: { name: "Acme", slug: "a" } },
  {
    description: "a slug longer than 63 characters",
    body: { name: "Acme", slug: "a".repeat(64) },
  },
  {
    description: "a slug with consecutive hyphens",
    body: { name: "Acme", slug: "ac--me" },
  },
  {
    description: "a slug with a leading hyphen",
    body: { name: "Acme", slug: "-acme" },
  },
  {
    description: "a slug with spaces",
    body: { name: "Acme", slug: "ac me" },
  },
  {
    description: "a reserved slug",
    body: { name: "Settings", slug: "settings" },
  },
  {
    description: "the slug of the account pages",
    body: { name: "Account", slug: "account" },
  },
] as const

export const SLUG_SUGGESTIONS = [
  { name: "Café Ünd Co", slug: "cafe-und-co" },
  { name: "  Studio   42!  ", slug: "studio-42" },
  { name: "Settings", slug: "settings-2" },
  { name: "Account", slug: "account-2" },
  { name: "A", slug: "a-organization" },
  { name: "!!!", slug: "organization" },
] as const
