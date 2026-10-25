export const VALID_ENVIRONMENT = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/database",
  AUTH_SECRET: "s".repeat(32),
}

export const REJECTED_ENVIRONMENTS = [
  {
    description: "SameSite=None without secure cookies",
    environment: { AUTH_COOKIE_SAME_SITE: "none", AUTH_COOKIE_SECURE: "false" },
    error: "SameSite=None requires secure cookies",
  },
  {
    description: "production over plain HTTP",
    environment: { NODE_ENV: "production", WEB_ORIGIN: "http://app.test" },
    error: "Production requires an HTTPS web origin",
  },
  {
    description: "production with secure cookies turned off",
    environment: {
      NODE_ENV: "production",
      WEB_ORIGIN: "https://app.test",
      AUTH_COOKIE_SECURE: "false",
    },
    error: "Production requires secure cookies",
  },
  {
    description: "a short auth secret",
    environment: { AUTH_SECRET: "short" },
    error: "AUTH_SECRET",
  },
] as const
