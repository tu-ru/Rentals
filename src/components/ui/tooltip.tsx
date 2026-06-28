import * as React from "react"
import { cn } from "../../lib/utils/cn"

interface TooltipContextValue {
  open: boolean
  setOpen: (value: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function useTooltipContext() {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error("Tooltip components must be used within Tooltip")
  return context
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return <TooltipContext.Provider value={{ open, setOpen }}>{children}</TooltipContext.Provider>
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) {
  const { setOpen } = useTooltipContext()
  const child = React.cloneElement(children, {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  })
  return asChild ? child : <span>{child}</span>
}

export function TooltipContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open } = useTooltipContext()
  if (!open) return null

  return (
    <div className={cn("absolute top-full z-50 mt-2 rounded-md bg-foreground px-2 py-1 text-xs text-background", className)}>
      {children}
    </div>
  )
}
