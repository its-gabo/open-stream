import type { ActivityValues } from "../types/activity.types"

const isSameValue = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right)

/**
 * The fields that differ between two versions of a resource, as they were
 * and as they are; null when nothing changed.
 */
export const diffActivityValues = (
  before: ActivityValues,
  after: ActivityValues
) => {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  const changedKeys = keys.filter(
    (key) => !isSameValue(before[key], after[key])
  )

  if (changedKeys.length === 0) return null

  return {
    before: Object.fromEntries(
      changedKeys.map((key) => [key, before[key] ?? null])
    ),
    after: Object.fromEntries(
      changedKeys.map((key) => [key, after[key] ?? null])
    ),
  }
}
