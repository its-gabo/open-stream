/** Midnight UTC on the first day of `now`'s month, when monthly usage limits start over. */
export const startOfUtcMonth = (now: Date = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
