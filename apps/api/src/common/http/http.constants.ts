export const API_BASE_PATH = "/api/v1"

export const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Seconds a connection may stay silent. An upload chunk is forwarded to object
 * storage before the reply, so this must outlast the slowest storage write
 * (Bun's default of 10 seconds does not; 255 is its maximum).
 */
export const SERVER_IDLE_TIMEOUT_SECONDS = 120
