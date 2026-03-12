import { useAuth } from "../../app/providers"
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

export function TopNav({ title, breadcrumb }: TopNavProps) {
  const { profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          {breadcrumb && <p className="text-xs text-muted-foreground">{breadcrumb}</p>}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full border border-border">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{profile?.full_name?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>{profile?.full_name ?? "User"}</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
