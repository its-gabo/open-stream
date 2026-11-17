import { DEFAULT_LIBRARY_PLAYER_SETTINGS } from "@workspace/shared"

/** Player settings the API refuses, each a change to otherwise valid settings. */
export const INVALID_PLAYER_SETTINGS = [
  {
    description: "a named color",
    body: { ...DEFAULT_LIBRARY_PLAYER_SETTINGS, accentColor: "red" },
  },
  {
    description: "a three-digit hex color",
    body: { ...DEFAULT_LIBRARY_PLAYER_SETTINGS, accentColor: "#f00" },
  },
  {
    description: "a hex color without its #",
    body: { ...DEFAULT_LIBRARY_PLAYER_SETTINGS, accentColor: "e11d48" },
  },
  {
    description: "a control left out",
    body: { accentColor: "#e11d48", showTitle: true },
  },
  {
    description: "a control that is not a boolean",
    body: { ...DEFAULT_LIBRARY_PLAYER_SETTINGS, showFullscreen: "no" },
  },
] as const
