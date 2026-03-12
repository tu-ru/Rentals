import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarStore {
  isCollapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (value) => set({ isCollapsed: value }),
    }),
    { name: "rentms-sidebar" },
  ),
)
