/** Extra space below the toasts, set by UI pinned to the same corner so toasts stack above it. */
export const TOASTER_BOTTOM_INSET_VARIABLE = "--toaster-bottom-inset"

/** Sonner's default offsets (24px, 16px on narrow screens) plus the inset. */
export const TOASTER_OFFSET = {
  bottom: `calc(24px + var(${TOASTER_BOTTOM_INSET_VARIABLE}, 0px))`,
} as const

export const TOASTER_MOBILE_OFFSET = {
  bottom: `calc(16px + var(${TOASTER_BOTTOM_INSET_VARIABLE}, 0px))`,
} as const

/** Sonner's space between stacked toasts. */
export const TOASTER_GAP_PX = 14
