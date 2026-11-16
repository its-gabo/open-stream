export type ReceivedEmail = {
  recipients: string[]
  /** The raw message: headers, then the MIME body. */
  data: string
}

/**
 * A minimal SMTP server that accepts every message, so tests can check what
 * the worker really sends. It speaks only the commands nodemailer uses
 * without TLS or authentication.
 */
export function startSmtpServer() {
  const received: ReceivedEmail[] = []

  type Session = {
    buffer: string
    recipients: string[]
    isReadingData: boolean
  }

  const server = Bun.listen<Session>({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open(socket) {
        socket.data = { buffer: "", recipients: [], isReadingData: false }
        socket.write("220 smtp.test ESMTP\r\n")
      },
      data(socket, chunk) {
        const session = socket.data

        session.buffer += chunk.toString()

        while (true) {
          if (session.isReadingData) {
            const end = session.buffer.indexOf("\r\n.\r\n")

            if (end === -1) return

            received.push({
              recipients: session.recipients,
              data: session.buffer.slice(0, end),
            })
            session.buffer = session.buffer.slice(end + 5)
            session.recipients = []
            session.isReadingData = false
            socket.write("250 Queued\r\n")
            continue
          }

          const lineEnd = session.buffer.indexOf("\r\n")

          if (lineEnd === -1) return

          const command = session.buffer.slice(0, lineEnd)

          session.buffer = session.buffer.slice(lineEnd + 2)

          const verb = command.slice(0, 4).toUpperCase()

          if (verb === "RCPT") {
            session.recipients.push(command.match(/<(.+)>/)?.[1] ?? "")
          }

          if (verb === "DATA") {
            session.isReadingData = true
            socket.write("354 Send the message\r\n")
          } else if (verb === "QUIT") {
            socket.write("221 Bye\r\n")
            socket.end()
          } else {
            socket.write("250 OK\r\n")
          }
        }
      },
    },
  })

  return {
    port: server.port,
    received,
    stop: () => server.stop(true),
  }
}
