export const VIEWER_DEVICES = [
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    deviceType: "desktop",
  },
  {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    deviceType: "mobile",
  },
  {
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
    deviceType: "mobile",
  },
  {
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    deviceType: "tablet",
  },
  {
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    deviceType: "tablet",
  },
] as const

export const INVALID_PROGRESS_REPORTS = [
  {
    description: "negative watched seconds",
    body: { watchedSeconds: -1, positionSeconds: 0 },
  },
  {
    description: "a negative position",
    body: { watchedSeconds: 1, positionSeconds: -1 },
  },
  { description: "no position", body: { watchedSeconds: 1 } },
] as const

export const INVALID_PERIODS = ["5", "365", "week"] as const
