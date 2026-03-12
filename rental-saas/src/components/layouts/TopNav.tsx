import { Bell } from "lucide-react"
import { ThemeToggle } from "../shared/ThemeToggle"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
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
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          {breadcrumb && <p className="text-xs text-muted-foreground">{breadcrumb}</p>}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1">3</Badge>
          </button>

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full border border-border">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>LK</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
