import { APP_NAME } from "@/lib/page-meta.constants"

export function AppBrand() {
  return (
    <div className="flex h-12 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <img
        src="/openstream-logo-trimmed.png"
        alt={APP_NAME}
        className="h-8 w-auto dark:invert group-data-[collapsible=icon]:hidden"
      />
      <img
        src="/openstream-signet.svg"
        alt={APP_NAME}
        className="hidden size-8 dark:invert group-data-[collapsible=icon]:block"
      />
    </div>
  )
}
