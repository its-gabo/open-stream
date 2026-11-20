import type { ReactNode } from "react"

type AnalyticsCardProps = {
  title: string
  description?: string
  /** Shown at the right of the title, e.g. a legend. */
  aside?: ReactNode
  children: ReactNode
}

/** A titled, bordered block of analytics, so charts and lists share one look. */
export function AnalyticsCard({
  title,
  description,
  aside,
  children,
}: AnalyticsCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}
