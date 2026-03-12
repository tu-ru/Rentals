import { Menu, Shield } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../../app/providers"
import { NotificationBell, ThemeToggle } from "../shared"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const navItems = [
  { label: "Dashboard", href: "/tenant" },
  { label: "Invoices", href: "/tenant/invoices" },
  { label: "Payments", href: "/tenant/payments" },
  { label: "Maintenance", href: "/tenant/maintenance" },
  { label: "Messages", href: "/tenant/messages" },
]

export function TenantLayout({ children, title }: { children: ReactNode; title: string }) {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/tenant" className="flex items-center gap-2 font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              <span>RentMS</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/tenant"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full border">
                    <Avatar className="h-9 w-9"><AvatarFallback>{profile?.full_name?.[0] ?? "T"}</AvatarFallback></Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>{profile?.full_name ?? "Tenant"}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut()}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 h-full w-72 bg-background p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Menu</p>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/tenant"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <h1 className="mb-4 text-xl font-semibold md:hidden">{title}</h1>
        {children}
      </main>
    </div>
  )
}
