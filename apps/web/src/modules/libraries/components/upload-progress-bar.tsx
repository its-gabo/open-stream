import { cn } from "@workspace/ui/lib/utils"

type UploadProgressBarProps = {
  percentage: number
  isPaused?: boolean
  className?: string
}

export function UploadProgressBar({
  percentage,
  isPaused = false,
  className,
}: UploadProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-300",
          isPaused && "bg-muted-foreground/40"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
