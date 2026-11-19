type FileRoute = (request: Request) => Response | Promise<Response>

/**
 * A local HTTP server that videos are imported from: each path answers as
 * its route says, and an unknown path with 404. Records every path asked for.
 */
export function startFileServer(routes: Record<string, FileRoute>) {
  const requestedPaths: string[] = []

  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    idleTimeout: 0,
    fetch(request) {
      const { pathname } = new URL(request.url)
      const route = routes[pathname]

      requestedPaths.push(pathname)

      return route ? route(request) : new Response(null, { status: 404 })
    },
  })

  return {
    host: `127.0.0.1:${server.port}`,
    url: (path: string) => `http://127.0.0.1:${server.port}${path}`,
    requestedPaths,
    stop: () => server.stop(true),
  }
}

/**
 * Answers every request with exactly `head` and `body`, then closes the
 * connection unless `isLeftOpen`; for answers `Bun.serve` would correct,
 * such as a `Content-Length` that does not match the body. Left open, only
 * the client ends the connection, as when it refuses the answer by its head.
 */
export function startRawHttpServer(
  head: string,
  body: Uint8Array,
  { isLeftOpen = false }: { isLeftOpen?: boolean } = {}
) {
  const response = Buffer.concat([Buffer.from(`${head}\r\n\r\n`), body])

  // Answering before the whole request head arrived would close the socket
  // with unread bytes, which resets the connection instead of ending it.
  const received = new WeakMap<Bun.Socket, string>()
  const answered = new WeakSet<Bun.Socket>()
  const unsent = new WeakMap<Bun.Socket, Buffer>()
  const writeUnsent = (socket: Bun.Socket) => {
    const remaining = unsent.get(socket)

    if (!remaining) return

    const written = socket.write(remaining)

    if (written < remaining.byteLength) {
      unsent.set(socket, remaining.subarray(Math.max(written, 0)))
      return
    }

    unsent.delete(socket)

    if (!isLeftOpen) socket.end()
  }

  const server = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      data(socket, chunk) {
        if (answered.has(socket)) return

        const request = (received.get(socket) ?? "") + chunk.toString()

        if (!request.includes("\r\n\r\n")) {
          received.set(socket, request)
          return
        }

        received.delete(socket)
        answered.add(socket)
        unsent.set(socket, response)
        writeUnsent(socket)
      },
      drain: writeUnsent,
    },
  })

  return {
    url: (path: string) => `http://127.0.0.1:${server.port}${path}`,
    stop: () => server.stop(true),
  }
}
