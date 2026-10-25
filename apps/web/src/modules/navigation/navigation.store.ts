import { create } from "zustand"
import { persist } from "zustand/middleware"

import { APP_SIDEBAR_STORAGE_KEY } from "./navigation.constants"

type SidebarStore = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      setIsOpen: (isOpen) => set({ isOpen }),
    }),
    { name: APP_SIDEBAR_STORAGE_KEY }
  )
)
