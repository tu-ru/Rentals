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
  Receipt,
  Settings,
  Shield,
  Users,
  Wrench,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
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
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore()
  const { pathname } = useLocation()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Failed to sign out from sidebar", error)
    }
  }

  return (
    <motion.aside
      layout
      transition={{ duration: 0.2 }}
      className="flex h-screen shrink-0 flex-col border-r border-border bg-card"
      animate={{ width: isCollapsed ? 64 : 240 }}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Shield className="h-5 w-5 text-primary" />
        {!isCollapsed && <span className="font-semibold">RentMS</span>}
      </div>

      <div className="flex flex-1 flex-col justify-between p-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={`flex h-10 items-center rounded-md px-3 text-sm transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${isCollapsed ? "justify-center" : "gap-3"}`}
              >
                <Icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.label}</span>}
                {item.label === "Messages" && unreadCount > 0 && !isCollapsed && <Badge className="ml-auto">{unreadCount}</Badge>}
              </NavLink>
            )
          })}
        </div>

        <Button variant="ghost" onClick={toggle} className="mt-2 w-full justify-center">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>

      <div className="border-t border-border p-3">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>LK</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Landlord Kenya</p>
              <p className="truncate text-xs text-muted-foreground">landlord@rentms.app</p>
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
