import {
  COVERAGE_EXCLUDED_FILES,
  COVERAGE_REPORT_PATH,
  FEATURE_COVERAGE_THRESHOLD,
  ROOT_FEATURE,
  isCoverageCountedFile,
} from "./feature-coverage.config"

type FeatureCoverage = { coveredLines: number; totalLines: number }

/**
 * Fails when any feature's e2e line coverage is below the threshold. Run
 * after `bun test e2e --coverage` (see `test:coverage`), which writes the
 * lcov report this reads.
 */
const featureOf = (path: string) => {
  const [, folder, ...rest] = path.split("/")

  return rest.length > 0 && folder ? folder : ROOT_FEATURE
}

const readFeatureCoverage = async () => {
  const report = Bun.file(COVERAGE_REPORT_PATH)

  if (!(await report.exists())) {
    throw new Error(
      `No coverage report at ${COVERAGE_REPORT_PATH}; run "bun run test:coverage"`
    )
  }

  const features = new Map<string, FeatureCoverage>()

  for (const record of (await report.text()).split("end_of_record")) {
    const path = record.match(/^SF:(.+)$/m)?.[1]
    const totalLines = Number(record.match(/^LF:(\d+)$/m)?.[1] ?? 0)
    const coveredLines = Number(record.match(/^LH:(\d+)$/m)?.[1] ?? 0)

    if (!path || !isCoverageCountedFile(path)) continue

    const feature = features.get(featureOf(path)) ?? {
      coveredLines: 0,
      totalLines: 0,
    }

    feature.coveredLines += coveredLines
    feature.totalLines += totalLines
    features.set(featureOf(path), feature)
  }

  return features
}

const features = await readFeatureCoverage()
const failing: string[] = []

console.log(
  `E2E line coverage per feature (needs ${FEATURE_COVERAGE_THRESHOLD * 100}%):`
)

for (const [feature, { coveredLines, totalLines }] of [
  ...features.entries(),
].sort(([left], [right]) => left.localeCompare(right))) {
  const share = totalLines === 0 ? 1 : coveredLines / totalLines
  const isPassing = share >= FEATURE_COVERAGE_THRESHOLD

  if (!isPassing) failing.push(feature)

  console.log(
    `  ${isPassing ? "✓" : "✗"} ${feature.padEnd(16)} ${(share * 100).toFixed(1).padStart(5)}%  (${coveredLines}/${totalLines} lines)`
  )
}

console.log(
  `Excluded entry points: ${Object.keys(COVERAGE_EXCLUDED_FILES).join(", ")}`
)

if (failing.length > 0) {
  console.error(
    `\nBelow ${FEATURE_COVERAGE_THRESHOLD * 100}% e2e coverage: ${failing.join(", ")}. Add e2e specs for them.`
  )
  process.exit(1)
}
