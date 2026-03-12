export type ToastOptions = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(options: ToastOptions) {
  if (typeof window !== "undefined") {
    // Minimal non-blocking notification placeholder
    // eslint-disable-next-line no-console
    console.log(`[toast:${options.variant ?? "default"}] ${options.title}${options.description ? ` - ${options.description}` : ""}`)
  }
}

export function useToast() {
  return { toast }
}

export function Toaster() {
  return null
}
