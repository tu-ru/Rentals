import { Building2, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Menu, ShieldCheck, Users, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { TopNav } from "./TopNav"

const navGroups = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/super-admin#overview", icon: LayoutDashboard },
      { label: "Organizations", href: "/super-admin#organizations", icon: Building2 },
      { label: "Users", href: "/super-admin#users", icon: Users },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Invitations", href: "/super-admin#invitations", icon: ClipboardList },
      { label: "Audit Logs", href: "/super-admin#audit", icon: ShieldCheck },
    ],
  },
]

export function SuperAdminShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 1024)

    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false)
      return
    }

    setCollapsed(false)
  }, [isDesktop])

  useEffect(() => {
    if (!location.hash) return

    const sectionId = location.hash.replace("#", "")
    const element = document.getElementById(sectionId)
    if (!element) return

    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [location.hash])

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [location.pathname, location.hash, isDesktop])

  const scrollToHash = (hash: string) => {
    const sectionId = hash.replace("#", "")
    const element = document.getElementById(sectionId)
    if (!element) return
    element.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleNavigate = (hash: string) => {
    if (location.hash === hash) {
      scrollToHash(hash)
      return
    }

    navigate(`/super-admin${hash}`)
    if (!isDesktop) setMobileOpen(false)
  }

  const compact = isDesktop && collapsed

  return (
    <div className="flex h-screen bg-background">
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-label="Close super admin sidebar"
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card/95 backdrop-blur-lg transition-transform duration-200 lg:static lg:z-auto",
          isDesktop ? (compact ? "lg:w-[82px]" : "lg:w-[286px]") : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className={`flex h-16 items-center gap-3 border-b border-border px-4 ${compact ? "justify-center" : "justify-between"}`}>
          <div className="flex min-w-0 items-center gap-3">
            {!compact && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
            )}
            {!compact && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">K535</p>
                <p className="text-xs text-muted-foreground">Platform Control</p>
              </div>
            )}
          </div>

          {isDesktop ? (
            compact ? (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm transition hover:bg-primary/15 hover:text-primary"
                aria-label="Expand sidebar"
                onClick={() => setCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )
          ) : (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted/60"
              aria-label="Close sidebar"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                {!compact && <p className="px-3 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{group.label}</p>}
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const hash = item.href.replace("/super-admin", "")
                    const isActive = location.hash === hash

                    return (
                      <button
                        type="button"
                        key={item.href}
                        onClick={() => handleNavigate(hash)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        } ${compact ? "justify-center px-3" : ""} ${isActive ? "after:absolute after:left-1.5 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-primary" : "after:hidden"} relative`}
                        title={compact ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!compact && <span className="font-medium">{item.label}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-5 border-t border-border pt-4">
            <div className="rounded-xl bg-muted/30 p-3">
            <div className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              {!compact && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">K535 Console</p>
                  <p className="text-xs text-muted-foreground">Platform oversight for organizations, users, invitations, and audit trails.</p>
                </div>
              )}
            </div>
            {!compact && <div className="mt-3 h-px bg-border/70" />}
            {!compact && <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Platform Control</p>}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-3 lg:hidden">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/60"
              aria-label="Open sidebar"
              onClick={() => setMobileOpen(true)}
            >
            <Menu className="h-4 w-4" />
            </button>
          <div>
            <p className="text-sm font-semibold">Super Admin</p>
            <p className="text-xs text-muted-foreground">Platform</p>
          </div>
        </div>

        <div className="hidden lg:block">
          <TopNav title="Super Admin" breadcrumb="Platform" />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
