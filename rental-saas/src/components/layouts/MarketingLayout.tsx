import { motion } from "framer-motion"
import { Link, NavLink } from "react-router-dom"
import type { ReactNode } from "react"
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
  const dashboardHref = normalizedRole === "tenant" ? "/tenant" : normalizedRole === "agent" ? "/agent" : "/dashboard"
  const isLoggedIn = Boolean(user)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground text-background font-bold">R</div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">RentMS Kenya</p>
              <p className="text-lg font-semibold">Rental Operating System</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link to={dashboardHref}><Button variant="outline">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="outline">Login</Button></Link>
                <Link to="/register"><Button>Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
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
          <p>© 2026 RentMS Kenya. All rights reserved.</p>
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
