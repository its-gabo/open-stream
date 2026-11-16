export const STORAGE_ADDRESSING_STYLES = {
  PATH: "path",
  VIRTUAL_HOSTED: "virtual_hosted",
} as const

/** Sample values that show what a path template renders to. */
export const STORAGE_PATH_PREVIEW_VALUES = {
  organizationId: "8f14e45f-ceea-467f-a0e6-0d5c1b9a3c71",
  libraryId: "c9f0f895-fb98-4b91-9f4b-42d2e1c37a40",
  videoId: "45c48cce-2e2d-4fbd-b8a0-9a1d27e3f5c2",
  year: "2026",
  month: "11",
  day: "14",
} as const

/** Result of the last connection test of a storage form. */
export const STORAGE_CONNECTION_STATES = {
  UNTESTED: "untested",
  REACHABLE: "reachable",
  UNREACHABLE: "unreachable",
} as const

/** Option value of the default storage in storage selects. */
export const DEFAULT_STORAGE_OPTION_VALUE = "default"
