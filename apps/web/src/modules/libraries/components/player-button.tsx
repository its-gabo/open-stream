import type { ReactNode } from "react"

type PlayerButtonProps = {
  label: string
  onClick: () => void
  children: ReactNode
}

/** An icon button for the player's dark controls. */
export function PlayerButton({ label, onClick, children }: PlayerButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none [&_svg]:size-5"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
