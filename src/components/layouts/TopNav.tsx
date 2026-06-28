import { Menu } from "lucide-react"
import { useAuth } from "../../app/providers"
import { useSidebarStore } from "../../hooks/useSidebarStore"
import { NotificationBell, ThemeToggle } from "../shared"
import { Avatar, AvatarFallback } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

interface TopNavProps {
  title: string
  breadcrumb?: string
}

function getInitials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

export function TopNav({ title, breadcrumb }: TopNavProps) {
  const { profile, signOut, user } = useAuth()
  const { setMobileOpen } = useSidebarStore()
  const displayName = profile?.full_name || user?.email || "User"

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Failed to sign out from top navigation", error)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted/60 hover:text-foreground lg:hidden"
            aria-label="Open sidebar"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            {breadcrumb && <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{breadcrumb}</p>}
            <h1 className="truncate text-lg font-semibold">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{profile?.full_name ?? "User"}</DropdownMenuItem>
                <DropdownMenuItem>{user?.email ?? ""}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleSignOut()}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
