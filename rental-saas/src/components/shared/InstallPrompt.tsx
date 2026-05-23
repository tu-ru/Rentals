import { useEffect, useMemo, useState } from "react"
import { Download, X } from "lucide-react"
import { useLocalStorage } from "../../hooks"
import { Button } from "../ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissedUntil, setDismissedUntil] = useLocalStorage<number>("habiqo-install-dismissed-until", 0)

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const isStandalone = useMemo(
    () => window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone,
    [],
  )

  const isDismissed = Date.now() < dismissedUntil
  const shouldShow = Boolean(deferredPrompt) && !isStandalone && !isDismissed

  const onInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const onDismiss = () => {
    setDismissedUntil(Date.now() + DISMISS_DURATION_MS)
  }

  if (!shouldShow) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border bg-background p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><Download className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install K535 for quick access</p>
          <p className="text-xs text-muted-foreground">Add this app to your home screen for a faster experience.</p>
        </div>
        <Button size="sm" onClick={() => void onInstall()}>Install</Button>
        <Button size="icon" variant="ghost" onClick={onDismiss} aria-label="Dismiss install prompt">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
