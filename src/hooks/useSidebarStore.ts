import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarStore {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
  setMobileOpen: (value: boolean) => void
  closeMobile: () => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (value) => set({ isCollapsed: value }),
      setMobileOpen: (value) => set({ isMobileOpen: value }),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    { name: "k535-sidebar" },
  ),
)
