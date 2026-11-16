import { Glob } from "bun"

import { isCoverageCountedFile } from "../coverage/feature-coverage.config"

/**
 * Preloaded in coverage runs: imports every counted file of `src/`, so a file
 * no spec reaches still shows up in the report, with its untested lines.
 * Without it, Bun leaves such files out and coverage looks higher than it is.
 */
const apiRoot = new URL("../../", import.meta.url).pathname

for (const path of new Glob("src/**/*.ts").scanSync(apiRoot)) {
  if (isCoverageCountedFile(path)) await import(`${apiRoot}${path}`)
}
