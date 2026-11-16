/** The whole stream as text, passing each complete line on as it arrives. */
export async function readLines(
  stream: ReadableStream<Uint8Array>,
  onLine?: (line: string) => void
) {
  const decoder = new TextDecoder()
  let output = ""
  let pending = ""

  for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true })

    output += text
    pending += text

    const lines = pending.split("\n")

    pending = lines.pop() ?? ""
    lines.forEach((line) => onLine?.(line.trim()))
  }

  if (pending) onLine?.(pending.trim())

  return output
}

/** ffmpeg exits successfully even when no frame matched, e.g. a seek past the end. */
export async function assertOutputWritten(outputPath: string) {
  if (!(await Bun.file(outputPath).exists())) {
    throw new Error(`ffmpeg wrote no output to ${outputPath}`)
  }
}
