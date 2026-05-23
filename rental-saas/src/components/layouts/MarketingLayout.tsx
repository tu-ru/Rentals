import { motion } from "framer-motion"
import { Link, NavLink } from "react-router-dom"
import { useState, type ReactNode } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "../ui/button"
import { ThemeToggle } from "../shared"
import { useAuth } from "../../app/providers"
import type { UserRole } from "../../types/auth.types"

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
]

export function MarketingLayout({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const normalizedRole = profile?.role ? (profile.role.trim().toLowerCase() as UserRole) : undefined
  const dashboardHref = normalizedRole === "tenant" ? "/tenant" : normalizedRole === "agent" ? "/agent" : normalizedRole === "super_admin" ? "/super-admin" : "/dashboard"
  const isLoggedIn = Boolean(user)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="min-w-0" onClick={() => setMenuOpen(false)}>
            <div className="leading-none">
              <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">K535</p>
              <p className="mt-1 text-base font-semibold sm:text-lg">Property control</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 rounded-full border border-border bg-card/70 p-1 text-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors ${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link to={dashboardHref}><Button variant="outline">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="outline">Login</Button></Link>
                <Link to="/contact"><Button>Request Access</Button></Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-foreground"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-6xl gap-4 px-6 py-5 text-sm">
              <div className="grid gap-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 transition-colors ${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <div className="grid gap-2">
                {isLoggedIn ? (
                  <Link to={dashboardHref} onClick={() => setMenuOpen(false)}>
                    <Button className="w-full" variant="outline">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      <Button className="w-full" variant="outline">Login</Button>
                    </Link>
                    <Link to="/contact" onClick={() => setMenuOpen(false)}>
                      <Button className="w-full">Request Access</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© 2026 K535. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
