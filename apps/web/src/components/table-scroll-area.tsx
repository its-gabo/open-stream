import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

/** Takes the height left in a page-filling card and scrolls the table in it under a sticky header. */
export function TableScrollArea({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="table-scroll-area"
      className={cn(
        "min-h-0 flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10 [&_[data-slot=table-header]]:bg-card [&_[data-slot=table-header]]:shadow-[inset_0_-1px_0_var(--color-border)]",
        className
      )}
      {...props}
    />
  )
}
