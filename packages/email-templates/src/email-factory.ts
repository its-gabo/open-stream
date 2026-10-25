import { toPlainText } from "@react-email/components"
import { renderToReadableStream } from "react-dom/server"

import type { EmailContent } from "./email-content.types"

type EmailNode = Parameters<typeof renderToReadableStream>[0]

const XHTML_DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

/** Wraps a template component in a class that renders it to HTML and plain text. */
export function emailTemplateFactory<TArgs extends unknown[]>(
  template: (...args: TArgs) => EmailNode
): new (...args: TArgs) => EmailContent {
  return class implements EmailContent {
    private readonly args: TArgs

    constructor(...args: TArgs) {
      this.args = args
    }

    async getText() {
      return toPlainText(await renderEmail(template(...this.args)))
    }

    getHtml() {
      return renderEmail(template(...this.args))
    }
  }
}

async function renderEmail(node: EmailNode) {
  const stream = await renderToReadableStream(node)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let html = ""

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    html += decoder.decode(value, { stream: true })
  }

  html += decoder.decode()

  return `${XHTML_DOCTYPE}${html.replace(/<!DOCTYPE.*?>/, "")}`
}
