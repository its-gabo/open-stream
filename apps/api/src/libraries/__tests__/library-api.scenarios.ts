import {
  LIBRARY_API_KEY_SCOPES,
  type LibraryApiKeyScope,
} from "@workspace/shared"

export const ALL_SCOPES: LibraryApiKeyScope[] = Object.values(
  LIBRARY_API_KEY_SCOPES
)

/** One request per scope-protected route; `:videoId` is replaced by an existing video. */
export const SCOPED_REQUESTS = [
  {
    scope: "videos:read",
    description: "list videos",
    method: "GET",
    path: "/videos",
    body: undefined,
  },
  {
    scope: "videos:read",
    description: "read a video",
    method: "GET",
    path: "/videos/:videoId",
    body: undefined,
  },
  {
    scope: "videos:read",
    description: "read a video's status",
    method: "GET",
    path: "/videos/:videoId/status",
    body: undefined,
  },
  {
    scope: "videos:upload",
    description: "create a video",
    method: "POST",
    path: "/videos",
    body: { title: "New" },
  },
  {
    scope: "videos:manage",
    description: "rename a video",
    method: "PATCH",
    path: "/videos/:videoId",
    body: { title: "Renamed" },
  },
  {
    scope: "videos:manage",
    description: "delete a video",
    method: "DELETE",
    path: "/videos/:videoId",
    body: undefined,
  },
  {
    scope: "playback:sign",
    description: "sign a playback URL",
    method: "POST",
    path: "/videos/:videoId/playback-urls",
    body: {},
  },
] as const satisfies {
  scope: LibraryApiKeyScope
  description: string
  method: string
  path: string
  body: unknown
}[]

export const REJECTED_API_KEY_BODIES = [
  { description: "no scopes", body: { name: "Empty", scopes: [] } },
  {
    description: "an unknown scope",
    body: { name: "Admin", scopes: ["videos:admin"] },
  },
  { description: "a blank name", body: { name: " ", scopes: ["videos:read"] } },
  {
    description: "a name that is too long",
    body: { name: "x".repeat(81), scopes: ["videos:read"] },
  },
] as const

export const BYTE_RANGES = [
  { range: "bytes=0-99", start: 0, end: 99 },
  { range: "bytes=1000-", start: 1000, end: 4095 },
  { range: "bytes=-100", start: 3996, end: 4095 },
  { range: "bytes=4000-99999", start: 4000, end: 4095 },
] as const

/** Requests the hosts `customer.example` and `*.cdn.example` allow. */
export const ALLOWED_PLAYBACK_REQUESTS = [
  {
    description: "a page on an allowed host",
    headers: { referer: "https://customer.example/watch?v=1" },
  },
  {
    description: "a subdomain of a wildcard host",
    headers: { referer: "https://eu.cdn.example/player" },
  },
  {
    description: "an allowed origin",
    headers: { origin: "https://customer.example" },
  },
] as const

export const BLOCKED_PLAYBACK_REQUESTS = [
  { description: "a request without a page", headers: {} },
  {
    description: "another host",
    headers: { referer: "https://evil.example/" },
  },
  {
    description: "a host that only ends like an allowed one",
    headers: { referer: "https://notcustomer.example/" },
  },
  {
    description: "the bare domain of a wildcard host",
    headers: { referer: "https://cdn.example/" },
  },
  {
    description: "an opaque origin",
    headers: { origin: "null" },
  },
] as const

export const REJECTED_SECURITY_BODIES = [
  {
    description: "a URL instead of a host",
    body: { allowedPlaybackHosts: ["https://a.example"] },
  },
  {
    description: "a path",
    body: { allowedPlaybackHosts: ["a.example/videos"] },
  },
  {
    description: "a wildcard in the middle",
    body: { allowedPlaybackHosts: ["a.*.example"] },
  },
  {
    description: "too many hosts",
    body: {
      allowedPlaybackHosts: Array.from(
        { length: 51 },
        (_, index) => `host${index}.example`
      ),
    },
  },
] as const
