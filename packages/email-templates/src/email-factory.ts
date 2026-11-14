import { toPlainText } from "@react-email/components"
import { createElement } from "react"
import { renderToReadableStream } from "react-dom/server"

import { EmailBrandContext } from "./templates/theme/email-brand-context"

import type { EmailContent } from "./email-content.types"
import type { EmailBrand } from "./templates/theme/email-brand-context"

type EmailNode = Parameters<typeof renderToReadableStream>[0]

const XHTML_DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

/**
 * Wraps a template component in a class that renders it to HTML and plain
 * text, with the sender's brand assets in context.
 */
export function emailTemplateFactory<TProps>(
  template: (props: TProps) => EmailNode
): new (props: TProps, brand: EmailBrand) => EmailContent {
  return class implements EmailContent {
    constructor(
      private readonly props: TProps,
      private readonly brand: EmailBrand
    ) {}

    async getText() {
      return toPlainText(await this.render())
    }

    getHtml() {
      return this.render()
    }

    private render() {
      return renderEmail(
        createElement(
          EmailBrandContext,
          { value: this.brand },
          template(this.props)
        )
      )
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
