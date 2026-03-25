import { Building2, ClipboardList, LayoutDashboard, ShieldCheck, Users } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"
import { TopNav } from "./TopNav"

const navItems = [
  { label: "Overview", href: "/super-admin#overview", icon: LayoutDashboard },
  { label: "Organizations", href: "/super-admin#organizations", icon: Building2 },
  { label: "Users", href: "/super-admin#users", icon: Users },
  { label: "Invitations", href: "/super-admin#invitations", icon: ClipboardList },
  { label: "Audit Logs", href: "/super-admin#audit", icon: ShieldCheck },
]

export function SuperAdminShell() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Platform Control</p>
              <p className="text-xs text-muted-foreground">Super admin operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav title="Super Admin" breadcrumb="Platform" />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
