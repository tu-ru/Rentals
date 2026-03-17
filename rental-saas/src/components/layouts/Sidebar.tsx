import { motion } from "framer-motion"
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MessageSquareText,
  Receipt,
  Settings,
  Shield,
  Users,
  Wrench,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { useAuth } from "../../app/providers"
import { useSidebarStore } from "../../hooks/useSidebarStore"
import { useUnreadCount } from "../../features/messaging/hooks"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard/tenants", icon: Users },
  { label: "Leases", href: "/dashboard/leases", icon: FileText },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "SMS", href: "/dashboard/sms", icon: MessageSquareText },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

function getInitials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { signOut, profile, user } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Failed to sign out from sidebar", error)
    }
  }

  const displayName = profile?.full_name || user?.email || "User"
  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Member"
  const email = user?.email ?? ""

  return (
    <motion.aside
      layout
      transition={{ duration: 0.2 }}
      className="flex h-screen shrink-0 flex-col border-r border-border bg-card/90 backdrop-blur"
      animate={{ width: isCollapsed ? 64 : 252 }}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold">RentMS</p>
            <p className="text-xs text-muted-foreground">Property Suite</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between px-2 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const end = item.href === "/dashboard"

            return (
              <NavLink
                end={end}
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `relative flex h-10 items-center rounded-lg px-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  } ${isCollapsed ? "justify-center" : "gap-3"} ${isActive ? "after:absolute after:left-1 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-primary" : "after:hidden"}`
                }
              >
                <Icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.label}</span>}
                {item.label === "Messages" && unreadCount > 0 && !isCollapsed && <Badge className="ml-auto">{unreadCount}</Badge>}
              </NavLink>
            )
          })}
        </div>

        <Button variant="ghost" onClick={toggle} className="mt-3 w-full justify-center text-xs uppercase tracking-wide">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>

      <div className="border-t border-border p-3">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(profile?.full_name || user?.email)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
