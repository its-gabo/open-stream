/** `850ms`, or `12.4s` from one second on. */
export const formatElapsed = (startedAt: number) => {
  const elapsedMs = Math.round(performance.now() - startedAt)

  return elapsedMs < 1000
    ? `${elapsedMs}ms`
    : `${(elapsedMs / 1000).toFixed(1)}s`
}
