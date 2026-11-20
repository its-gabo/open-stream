import { useHotkey } from "@tanstack/react-hotkeys"
import { useEffect } from "react"

import type { RefObject } from "react"

/** Closes a menu drawn inside the player on Escape, or when the pointer goes down outside it. */
export function usePlayerMenuDismiss(
  menuRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  close: () => void
) {
  useHotkey("Escape", close, {
    target: menuRef,
    enabled: isOpen,
    capture: true,
  })

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) close()
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)

    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [menuRef, isOpen, close])
}
