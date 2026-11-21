import type { ReactNode } from "react"

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&lrm;": "‎",
  "&rlm;": "‏",
}

const decodeEntities = (text: string) =>
  text.replace(
    /&(amp|lt|gt|nbsp|lrm|rlm);/g,
    (entity) => ENTITIES[entity] ?? entity
  )

type CueNode = { tag: "b" | "i" | "u" | null; children: (CueNode | string)[] }

/**
 * A cue's text as elements: bold, italic and underline stay, voice tags only
 * name the speaker, and nothing else is markup, as the API keeps no other.
 * Built as elements rather than HTML, so no text can become markup.
 */
function toCueTree(text: string) {
  const root: CueNode = { tag: null, children: [] }
  const stack = [root]

  for (const part of text.split(/(<[^>]*>)/)) {
    const tag = part.match(/^<(\/?)([biu])>$/)

    if (tag?.[1] === "/" && stack.length > 1) {
      stack.pop()
    } else if (tag && !tag[1]) {
      const node: CueNode = { tag: tag[2] as CueNode["tag"], children: [] }

      stack.at(-1)!.children.push(node)
      stack.push(node)
    } else if (!part.startsWith("<")) {
      stack.at(-1)!.children.push(decodeEntities(part))
    }
  }

  return root
}

const renderCueNode = (node: CueNode | string, key: number): ReactNode => {
  if (typeof node === "string") return node

  const children = node.children.map(renderCueNode)

  if (node.tag === "b") return <b key={key}>{children}</b>
  if (node.tag === "i") return <i key={key}>{children}</i>
  if (node.tag === "u") return <u key={key}>{children}</u>

  return children
}

/** The text of one caption cue, its lines as the track breaks them. */
export function PlayerCaptionText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <span key={index} className="block">
          {renderCueNode(toCueTree(line), index)}
        </span>
      ))}
    </>
  )
}
