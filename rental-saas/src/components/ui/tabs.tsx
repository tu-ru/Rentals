import { createContext, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "../../lib/utils/cn"

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tabs components must be used within Tabs")
  return context
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue)
  return <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("inline-flex rounded-md bg-muted p-1", className)}>{children}</div>
}

export function TabsTrigger({ value, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const tabs = useTabsContext()
  const active = tabs.value === value

  return (
    <button
      type="button"
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm",
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={() => tabs.setValue(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const tabs = useTabsContext()
  if (tabs.value !== value) return null
  return <div className={className}>{children}</div>
}
