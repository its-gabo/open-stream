export const VALID_ENVIRONMENT = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/database",
  AUTH_SECRET: "s".repeat(32),
  OBJECT_STORAGE_ACCESS_KEY_ID: "access-key",
  OBJECT_STORAGE_SECRET_ACCESS_KEY: "secret-key",
  STORAGE_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
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
    description: "a storage encryption key that is not 32 bytes",
    environment: {
      STORAGE_ENCRYPTION_KEY: Buffer.alloc(16, 1).toString("base64"),
    },
    error: "STORAGE_ENCRYPTION_KEY",
  },
  {
    description: "a stall timeout that a late heartbeat could reach",
    environment: {
      VIDEO_PROCESSING_HEARTBEAT_INTERVAL_MS: "60000",
      VIDEO_PROCESSING_STALL_TIMEOUT_MS: "90000",
    },
    error: "at least twice the heartbeat interval",
  },
  {
    description:
      "a chapter request timeout the idle connection would not outlast",
    environment: { CHAPTER_GENERATION_REQUEST_TIMEOUT_MS: "180000" },
    error: "CHAPTER_GENERATION_REQUEST_TIMEOUT_MS",
  },
  {
    description: "a short auth secret",
    environment: { AUTH_SECRET: "short" },
    error: "AUTH_SECRET",
  },
] as const
