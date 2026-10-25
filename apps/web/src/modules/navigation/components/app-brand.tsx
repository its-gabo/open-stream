import { ClapperboardIcon } from "lucide-react"

import { APP_NAME } from "@/lib/page-meta.constants"

export function AppBrand() {
  return (
    <div className="flex h-12 items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ClapperboardIcon className="size-4" />
      </span>
      <span className="translate-y-px font-heading text-lg font-bold text-primary group-data-[collapsible=icon]:hidden">
        {APP_NAME}
      </span>
    </div>
  )
}
