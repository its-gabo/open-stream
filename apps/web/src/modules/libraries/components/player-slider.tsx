import { cn } from "@workspace/ui/lib/utils"
import { useHotkeys } from "@tanstack/react-hotkeys"
import { useRef, useState } from "react"

import { PLAYER_SLIDER_KEY_DIRECTIONS } from "../libraries.constants"

import type { PointerEvent, ReactNode } from "react"

type PlayerSliderProps = {
  /** From 0 to 1. */
  value: number
  onChange: (value: number) => void
  label: string
  valueText: string
  /** From 0 to 1, drawn behind the value, e.g. what is buffered. */
  secondaryValue?: number
  /** Where the pointer is over the track, from 0 to 1; null once it leaves. */
  onHoverChange?: (value: number | null) => void
  /** Shown above the hovered position, e.g. a preview. */
  hoverContent?: ReactNode
  /** Half the width of `hoverContent`, which keeps it within the slider at its ends. */
  hoverContentHalfWidth?: number
  /** How far the arrow keys move the value. */
  keyboardStep: number
  className?: string
}

/** A horizontal slider for the player's dark controls, dragged with the pointer or moved with the arrow keys. */
export function PlayerSlider({
  value,
  onChange,
  label,
  valueText,
  secondaryValue,
  onHoverChange,
  hoverContent,
  hoverContentHalfWidth = 0,
  keyboardStep,
  className,
}: PlayerSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const readValue = (event: PointerEvent) => {
    const rect = trackRef.current!.getBoundingClientRect()

    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  }

  const updateHover = (next: number | null) => {
    setHoverValue(next)
    onHoverChange?.(next)
  }

  useHotkeys(
    (
      Object.entries(PLAYER_SLIDER_KEY_DIRECTIONS) as [
        keyof typeof PLAYER_SLIDER_KEY_DIRECTIONS,
        number,
      ][]
    ).map(([hotkey, direction]) => ({
      hotkey,
      callback: () =>
        onChange(Math.min(1, Math.max(0, value + direction * keyboardStep))),
    })),
    { target: trackRef, conflictBehavior: "allow", capture: true }
  )

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={valueText}
      className={cn(
        "group/slider relative flex h-4 cursor-pointer touch-none items-center outline-none",
        className
      )}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        setIsDragging(true)
        onChange(readValue(event))
      }}
      onPointerMove={(event) => {
        const next = readValue(event)

        updateHover(next)

        if (isDragging) onChange(next)
      }}
      onPointerUp={() => setIsDragging(false)}
      onPointerLeave={() => {
        if (!isDragging) updateHover(null)
      }}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] group-hover/slider:h-1.5 group-focus-visible/slider:h-1.5">
        {secondaryValue !== undefined && (
          <div
            className="absolute inset-y-0 left-0 bg-white/35"
            style={{ width: `${secondaryValue * 100}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 bg-white"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <div
        className={cn(
          "absolute size-3 -translate-x-1/2 rounded-full bg-white shadow transition-transform group-hover/slider:scale-100 group-focus-visible/slider:scale-100 group-focus-visible/slider:ring-2 group-focus-visible/slider:ring-white/60",
          isDragging ? "scale-100" : "scale-0"
        )}
        style={{ left: `${value * 100}%` }}
      />
      {hoverContent && hoverValue !== null && (
        <div
          className="pointer-events-none absolute bottom-full mb-3 -translate-x-1/2"
          style={{
            left: `clamp(${hoverContentHalfWidth}px, ${hoverValue * 100}%, calc(100% - ${hoverContentHalfWidth}px))`,
          }}
        >
          {hoverContent}
        </div>
      )}
    </div>
  )
}
