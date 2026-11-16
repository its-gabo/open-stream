import {
  STORAGE_FIELD_LIMITS,
  STORAGE_PATH_VARIABLES,
} from "../constants/libraries.constants"

import type { StoragePathValues } from "../types/libraries.types"

const PLACEHOLDER_PATTERN = /\{([^{}]*)\}/g
const LITERAL_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/
const KNOWN_VARIABLES: ReadonlySet<string> = new Set(
  Object.values(STORAGE_PATH_VARIABLES)
)

/**
 * A template is a `/`-separated folder path of literal segments and
 * `{variable}` placeholders. It must place every video in its own folder, so
 * `{videoId}` is required; `..` and empty segments are rejected so a template
 * cannot escape its prefix.
 */
export const isValidStoragePathTemplate = (template: string): boolean => {
  if (
    template.length === 0 ||
    template.length > STORAGE_FIELD_LIMITS.PATH_TEMPLATE_MAX_LENGTH
  ) {
    return false
  }

  const variables = [...template.matchAll(PLACEHOLDER_PATTERN)].map(
    ([, name]) => name ?? ""
  )

  if (!variables.every((name) => KNOWN_VARIABLES.has(name))) return false
  if (!variables.includes(STORAGE_PATH_VARIABLES.VIDEO_ID)) return false

  return template.split("/").every((segment) => {
    const literal = segment.replace(PLACEHOLDER_PATTERN, "x")

    return (
      segment !== "." &&
      segment !== ".." &&
      LITERAL_SEGMENT_PATTERN.test(literal)
    )
  })
}

/** Fills a valid template, e.g. `{organizationId}/{videoId}` → `0b9…/5c1…`. */
export const renderStoragePath = (
  template: string,
  values: StoragePathValues
): string =>
  template.replace(
    PLACEHOLDER_PATTERN,
    (_, name: keyof StoragePathValues) => values[name]
  )
