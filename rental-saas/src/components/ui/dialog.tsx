import { createContext, useContext, useState, type ReactNode } from "react"
import { cn } from "../../lib/utils/cn"

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) throw new Error("Dialog components must be used within Dialog")
  return context
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = (next: boolean) => {
    onOpenChange?.(next)
    if (controlledOpen === undefined) setInternalOpen(next)
  }

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children }: { children: ReactNode }) {
  const { setOpen } = useDialogContext()
  return (
    <span onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(true)}>
      {children}
    </span>
  )
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useDialogContext()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className={cn("w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl", className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-1">{children}</div>
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2">{children}</div>
}
