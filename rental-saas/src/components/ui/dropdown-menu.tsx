import * as React from "react"
import { cn } from "../../lib/utils/cn"

interface DropdownContextValue {
  open: boolean
  setOpen: (next: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null)

function useDropdownContext() {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("Dropdown components must be within DropdownMenu")
  return context
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return <DropdownContext.Provider value={{ open, setOpen }}>{children}</DropdownContext.Provider>
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) {
  const { setOpen } = useDropdownContext()
  const child = React.cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event)
      setOpen(true)
    },
  })
  return asChild ? child : <button type="button">{child}</button>
}

export function DropdownMenuContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = useDropdownContext()

  React.useEffect(() => {
    if (!open) return
    const onClick = () => setOpen(false)
    window.addEventListener("click", onClick)
    return () => window.removeEventListener("click", onClick)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className={cn("absolute right-0 z-50 mt-2 min-w-44 rounded-md border bg-popover p-1 shadow-md", className)}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted", className)}
      {...props}
    />
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}
