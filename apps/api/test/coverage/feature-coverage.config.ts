/** Every feature (a top-level folder of `src/`) needs this share of its lines run by the e2e specs. */
export const FEATURE_COVERAGE_THRESHOLD = 0.8

/** Where `bun test --coverage` writes its lcov report. */
export const COVERAGE_REPORT_PATH = "coverage/lcov.info"

/** Files of `src/` directly inside it, rather than in a feature folder, count as this feature. */
export const ROOT_FEATURE = "app"

/**
 * Files left out of the rule, each with the reason. Only process entry
 * points belong here: importing them starts a server, a worker or a script,
 * so no spec can load them. Everything they call is covered through the
 * modules they compose.
 */
export const COVERAGE_EXCLUDED_FILES: Record<string, string> = {
  "src/index.ts": "Starts the HTTP server on import",
  "src/worker.ts": "Starts the background worker on import",
  "src/db/migrate.ts": "Runs migrations on import",
  "src/openapi/export-openapi-schema.ts": "Writes the OpenAPI file on import",
}

/** Code that is not run, only declared, so it never counts against a feature. */
export const isCoverageCountedFile = (path: string) =>
  path.startsWith("src/") &&
  path.endsWith(".ts") &&
  !path.includes("/__tests__/") &&
  !path.endsWith(".types.ts") &&
  !(path in COVERAGE_EXCLUDED_FILES)
