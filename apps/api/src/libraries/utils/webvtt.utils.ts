/** `HH:MM:SS.mmm`, as WebVTT cue timings are written. */
export const formatWebVttTimestamp = (seconds: number) => {
  const milliseconds = Math.round(seconds * 1000)
  const hours = Math.floor(milliseconds / 3_600_000)
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000)
  const remainder = (milliseconds % 60_000) / 1000

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`
}

/** Cue text on one line, with the characters WebVTT reserves escaped. */
export const toWebVttCueText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
