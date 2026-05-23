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
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "../../app/providers"
import { useUnreadCount } from "../../features/messaging/hooks"
import { useSidebarStore } from "../../hooks/useSidebarStore"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Properties", href: "/dashboard/properties", icon: Building2 },
      { label: "Tenants", href: "/dashboard/tenants", icon: Users },
      { label: "Leases", href: "/dashboard/leases", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
      { label: "SMS", href: "/dashboard/sms", icon: MessageSquareText },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
]

function getInitials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

export function Sidebar() {
  const { pathname } = useLocation()
  const { isCollapsed, isMobileOpen, toggle, setCollapsed, closeMobile } = useSidebarStore()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { signOut, profile, user } = useAuth()
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 1024)

    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  useEffect(() => {
    if (!isDesktop) {
      closeMobile()
    }
  }, [isDesktop, closeMobile])

  useEffect(() => {
    if (!isDesktop) {
      closeMobile()
    }
  }, [pathname, isDesktop, closeMobile])

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
  const compact = isDesktop && isCollapsed

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-label="Close sidebar"
        onClick={closeMobile}
      />

      <motion.aside
        layout={isDesktop}
        transition={{ duration: 0.2 }}
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur-lg transition-transform duration-200 lg:static lg:z-auto",
          isDesktop ? "" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        animate={isDesktop ? { width: compact ? 82 : 286 } : { width: 288 }}
      >
        <div className={`flex h-16 mr-4 items-center gap-3 border-b border-border px-4 ${compact ? "justify-center" : "justify-between"}`}>
          <div className="flex min-w-0 items-center gap-3">
            {!compact && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
            )}
            {!compact && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">K535</p>
                <p className="text-xs text-muted-foreground">Operations Suite</p>
              </div>
            )}
          </div>

          {isDesktop ? (
            compact ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Expand sidebar"
                className="h-10 w-10 rounded-xl bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary"
                onClick={() => setCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Collapse sidebar"
                className="h-9 w-9 rounded-xl"
                onClick={toggle}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close sidebar"
              className="h-9 w-9 rounded-xl"
              onClick={closeMobile}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {navGroups.map((section) => (
              <div key={section.label} className="space-y-2">
                {!compact && <p className="px-3 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{section.label}</p>}

                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const end = item.href === "/dashboard"

                    return (
                      <NavLink
                        end={end}
                        key={item.href}
                        to={item.href}
                        onClick={() => {
                          if (!isDesktop) closeMobile()
                        }}
                        className={({ isActive }) =>
                          `relative flex min-h-11 items-center rounded-xl px-3.5 text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          } ${compact ? "justify-center px-3" : "gap-3"} ${isActive ? "after:absolute after:left-1.5 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-primary" : "after:hidden"}`
                        }
                        title={compact ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!compact && <span className="font-medium">{item.label}</span>}
                        {item.label === "Messages" && unreadCount > 0 && !compact && <Badge className="ml-auto">{unreadCount}</Badge>}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className={`${compact ? "flex justify-center bg-transparent p-0" : "rounded-xl border border-border bg-background/70 p-3"}`}>
              <div className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
                {!compact && (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(profile?.full_name || user?.email)}</AvatarFallback>
                  </Avatar>
                )}
                {!compact && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{roleLabel}</p>
                  </div>
                )}
              </div>

              {!compact && <div className="mt-3 h-px bg-border/70" />}

              {!compact && <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Workspace Access</p>}

              <div className={compact ? "flex justify-center" : "mt-3"}>
                {compact ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary"
                    aria-label="Logout"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => void handleSignOut()}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
