import { APP_NAME } from "./page-meta.constants"

import type { PageMetaOptions } from "./page-meta.types"

export function createPageMeta({
  title,
  description,
  noIndex = true,
}: PageMetaOptions) {
  const fullTitle = title === APP_NAME ? APP_NAME : `${title} | ${APP_NAME}`

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary" },
    ...(noIndex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
  ]
}
