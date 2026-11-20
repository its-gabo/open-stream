import { cn } from "@workspace/ui/lib/utils"

type FigureStripProps = {
  /** Up to four; a figure not known yet shows a dash, so the strip keeps its shape. */
  figures: { key: string; label: string; value: string | null }[]
}

/** Headline figures in one bordered strip, two by two until there is room for four in a row, like analytics totals. */
export function FigureStrip({ figures }: FigureStripProps) {
  return (
    <div className="@container rounded-lg border">
      <dl className="grid grid-cols-2 @lg:grid-cols-4">
        {figures.map(({ key, label, value }, index) => (
          <div
            key={key}
            className={cn(
              "flex min-w-0 flex-col gap-1 border-border px-4 py-3.5",
              index % 2 === 1 && "border-l",
              index >= 2 && "border-t @lg:border-t-0",
              index === 2 && "@lg:border-l"
            )}
          >
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="truncate text-2xl font-semibold tabular-nums">
              {value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
