import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"
import { useTheme } from "../../app/providers"

export type ToastOptions = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(options: ToastOptions) {
  const { title, description, variant } = options
  if (variant === "destructive") {
    sonnerToast.error(title, { description })
    return
  }
  sonnerToast(title, { description })
}

export function useToast() {
  return { toast }
}

export function Toaster() {
  const { resolvedTheme } = useTheme()

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        className: "border border-border bg-background text-foreground shadow-xl",
        descriptionClassName: "text-muted-foreground",
      }}
    />
  )
}
