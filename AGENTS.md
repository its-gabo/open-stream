# OpenStream: rules for contributors and coding agents

## Testing

- **Every feature needs at least 80% line coverage from e2e specs.** A feature is a top-level folder of `apps/api/src/` (`libraries`, `webhooks`, `auth`, …); files directly in `src/` count as the `app` feature. Unit specs do not count towards it: only `*.e2e.spec.ts` files run in the coverage check.
- A change is not done until `bun run test:coverage` passes. It runs the e2e specs with coverage and fails, listing the features, when any of them is below 80%. Check it before you finish, and add e2e specs to the feature you changed rather than to another one to raise the total.
- Files no spec loads are counted as untested, so a new file does not slip past the check by never being imported.
- E2e specs drive the real app the way its users do: HTTP requests through the router, the background worker through Redis, emails through SMTP. Call services directly only for what has no HTTP entry point, such as a queue job.
- New features come with their e2e specs in the same change, in a `__tests__/` folder next to the code (`*.e2e.spec.ts`, with `it.each` data in `*.scenarios.ts`).
- Do not lower the threshold, exclude files or skip specs to make the check pass. The only exclusions are process entry points that start something when imported, listed with their reason in `apps/api/test/coverage/feature-coverage.config.ts`; adding to that list needs a reason of the same kind.
- The web app has no e2e setup yet, so the rule applies to the API for now. When browser e2e specs are added, extend the rule to web features.
