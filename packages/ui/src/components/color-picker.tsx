import * as React from "react"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  hexToHsv,
  hsvToHex,
  isLightColor,
  normalizeHexColor,
  type HsvColor,
} from "@workspace/ui/lib/color"

type ColorSwatch = { value: string; label: string }

type ColorPickerLabels = {
  /** The saturation and brightness area. */
  area: string
  hue: string
  swatches: string
}

type ColorPickerProps = {
  /** A `#rrggbb` color; anything else leaves the picker where it was. */
  value: string
  onChange: (value: string) => void
  swatches?: ColorSwatch[]
  labels: ColorPickerLabels
  className?: string
}

const FALLBACK_COLOR = "#ffffff"
const KEY_STEP = 0.01
const LARGE_KEY_STEP = 0.1

const clampFraction = (value: number) => Math.min(1, Math.max(0, value))

/** Where the pointer is inside the element, from 0 to 1 on each axis. */
const readPointerFractions = (
  element: HTMLElement,
  event: React.PointerEvent
) => {
  const rect = element.getBoundingClientRect()

  return {
    x: clampFraction((event.clientX - rect.left) / rect.width),
    y: clampFraction((event.clientY - rect.top) / rect.height),
  }
}

/** Calls `onMove` while the pointer is pressed on the element, including the press itself. */
function usePointerDrag(onMove: (x: number, y: number) => void) {
  const [isDragging, setIsDragging] = React.useState(false)

  return {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDragging(true)
      const { x, y } = readPointerFractions(event.currentTarget, event)

      onMove(x, y)
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!isDragging) return

      const { x, y } = readPointerFractions(event.currentTarget, event)

      onMove(x, y)
    },
    onPointerUp: () => setIsDragging(false),
  }
}

/** How far an arrow key moves a fraction, or null for other keys; Shift takes larger steps. */
const readArrowStep = (event: React.KeyboardEvent, axis: "x" | "y") => {
  const step = event.shiftKey ? LARGE_KEY_STEP : KEY_STEP
  const keys =
    axis === "x"
      ? { ArrowRight: step, ArrowLeft: -step }
      : { ArrowUp: step, ArrowDown: -step }

  return keys[event.key as keyof typeof keys] ?? null
}

/**
 * Picks a color by dragging over saturation and brightness and along the
 * hue, or from preset swatches. Keeps its own hue, so dragging through
 * grays and black does not lose it.
 */
function ColorPicker({
  value,
  onChange,
  swatches = [],
  labels,
  className,
}: ColorPickerProps) {
  const [hsv, setHsv] = React.useState<HsvColor>(() =>
    hexToHsv(normalizeHexColor(value) ?? FALLBACK_COLOR)
  )
  const [followedColor, setFollowedColor] = React.useState(value)
  const hex = hsvToHex(hsv)
  const selected = normalizeHexColor(value)

  // A color typed or picked elsewhere moves the picker; grays keep the hue it had.
  if (value !== followedColor) {
    setFollowedColor(value)

    if (selected && selected !== hex) {
      const next = hexToHsv(selected)

      setHsv({ ...next, h: next.s === 0 || next.v === 0 ? hsv.h : next.h })
    }
  }

  const updateHsv = (changes: Partial<HsvColor>) => {
    const next = { ...hsv, ...changes }

    setHsv(next)
    onChange(hsvToHex(next))
  }

  const areaDrag = usePointerDrag((x, y) => updateHsv({ s: x, v: 1 - y }))
  const hueDrag = usePointerDrag((x) => updateHsv({ h: x * 360 }))

  return (
    <div
      data-slot="color-picker"
      className={cn("flex flex-col gap-3", className)}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-label={labels.area}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={hex}
        className="relative h-36 w-full cursor-crosshair touch-none rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{
          backgroundColor: `hsl(${hsv.h} 100% 50%)`,
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
        {...areaDrag}
        onKeyDown={(event) => {
          const saturationStep = readArrowStep(event, "x")
          const valueStep = readArrowStep(event, "y")

          if (saturationStep === null && valueStep === null) return

          event.preventDefault()
          updateHsv({
            s: clampFraction(hsv.s + (saturationStep ?? 0)),
            v: clampFraction(hsv.v + (valueStep ?? 0)),
          })
        }}
      >
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_1px_3px_rgb(0_0_0/0.3)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hex,
          }}
        />
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={labels.hue}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        className="relative h-3 w-full cursor-pointer touch-none rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
        {...hueDrag}
        onKeyDown={(event) => {
          const step = readArrowStep(event, "x")

          if (step === null) return

          event.preventDefault()
          updateHsv({ h: (hsv.h + step * 360 + 360) % 360 })
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_1px_3px_rgb(0_0_0/0.3)]"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: `hsl(${hsv.h} 100% 50%)`,
          }}
        />
      </div>
      {swatches.length > 0 && (
        <div
          role="group"
          aria-label={labels.swatches}
          className="grid grid-cols-9 gap-1.5"
        >
          {swatches.map((swatch) => {
            const isSelected = swatch.value === selected

            return (
              <button
                key={swatch.value}
                type="button"
                aria-label={swatch.label}
                aria-pressed={isSelected}
                title={swatch.label}
                className="flex aspect-square items-center justify-center rounded-md ring-1 ring-foreground/15 transition-transform outline-none ring-inset hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50"
                style={{ backgroundColor: swatch.value }}
                onClick={() => onChange(swatch.value)}
              >
                {isSelected && (
                  <CheckIcon
                    className={cn(
                      "size-3.5",
                      isLightColor(swatch.value) ? "text-black" : "text-white"
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type ColorInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> & {
  value: string
  onChange: (value: string) => void
  swatches?: ColorSwatch[]
  labels: ColorPickerLabels & {
    /** The swatch button that opens the picker. */
    trigger: string
  }
}

/** A hex color field whose swatch opens a `ColorPicker`; typing a hex code works too. */
function ColorInput({
  value,
  onChange,
  swatches,
  labels,
  className,
  ...props
}: ColorInputProps) {
  const color = normalizeHexColor(value)

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Popover>
          <PopoverTrigger
            render={
              <InputGroupButton
                size="icon-xs"
                aria-label={labels.trigger}
                disabled={props.disabled}
              />
            }
          >
            <span
              className={cn(
                "size-4 rounded-sm ring-1 ring-foreground/20 ring-inset",
                !color &&
                  "bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-size-[8px_8px]"
              )}
              style={color ? { backgroundColor: color } : undefined}
            />
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <ColorPicker
              value={value}
              onChange={onChange}
              swatches={swatches}
              labels={labels}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupInput
        autoComplete="off"
        spellCheck={false}
        className="font-mono text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </InputGroup>
  )
}

export { ColorInput, ColorPicker }
export type { ColorPickerLabels, ColorSwatch }
