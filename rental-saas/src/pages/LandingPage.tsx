import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { MarketingLayout } from "../components/layouts"
import { useAuth } from "../app/providers"
import type { UserRole } from "../types/auth.types"

const stats = [
  { label: "Units tracked", value: "2,400+" },
  { label: "Monthly collections", value: "KES 120M" },
  { label: "Avg. response time", value: "< 2 hours" },
]

const highlights = [
  {
    title: "Complete rental operations",
    body: "From leasing to collections, every workflow is connected so your team operates from one source of truth.",
  },
  {
    title: "Tenant-first experience",
    body: "Tenants get a mobile portal for payments, maintenance, and messaging so support volume drops while satisfaction rises.",
  },
  {
    title: "Actionable analytics",
    body: "Real-time KPIs, reports, and exports surface the health of your portfolio and spotlight risks early.",
  },
]

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function LandingPage() {
  const { user, profile } = useAuth()
  const normalizedRole = profile?.role ? (profile.role.trim().toLowerCase() as UserRole) : undefined
  const dashboardHref = normalizedRole === "tenant" ? "/tenant" : normalizedRole === "agent" ? "/agent" : normalizedRole === "super_admin" ? "/super-admin" : "/dashboard"
  const isLoggedIn = Boolean(user)

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('/_bleed_img_2.jpg')] bg-cover bg-center"
          style={{
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/75 to-background/95" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.35))] mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-soft-light" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")" }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.5 }}>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Modern Rental Operations</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-6xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Run your rentals like a high-performing company.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              RentMS Kenya unifies property operations, tenant experiences, and financial controls in one system. From M-Pesa reconciliation to maintenance SLAs, everything stays connected, measurable, and auditable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={isLoggedIn ? dashboardHref : "/login"}>
                <Button className="px-6">{isLoggedIn ? "Go to dashboard" : "Sign in"}</Button>
              </Link>
              <Link to="/features"><Button variant="outline" className="px-6">Explore features</Button></Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-card/70 p-4">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-border bg-card/80 p-6 shadow-xl"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Platform Snapshot</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Revenue MTD</p>
                <p className="text-3xl font-semibold">KES 18,420,000</p>
                <p className="text-xs text-emerald-500">+12.4% vs last month</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Occupancy</p>
                <p className="text-3xl font-semibold">94.2%</p>
                <p className="text-xs text-muted-foreground">Target 80%</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Open Maintenance</p>
                <p className="text-3xl font-semibold">27</p>
                <p className="text-xs text-muted-foreground">Emergency: 2</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          transition={{ duration: 0.5 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            transition={{ duration: 0.5 }}
            className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Why RentMS</p>
              <h2 className="mt-3 text-3xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
                Built for teams managing real-world rental operations.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our workflows mirror how Kenyan property teams actually operate: M-Pesa collections, high tenant turnover, and real-time service needs. RentMS gives you visibility without adding admin overhead.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <p className="text-sm font-semibold">Explore the full platform</p>
              <p className="mt-2 text-sm text-muted-foreground">Detailed feature breakdowns, use cases, and role-based capabilities.</p>
              <Link to="/features"><Button className="mt-4">Go to Features</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-border bg-foreground px-8 py-12 text-background"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-background/70">Ready to build momentum?</p>
              <h2 className="mt-3 text-3xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
                Start with a tailored onboarding for your portfolio.
              </h2>
            </div>
            <div className="flex gap-3">
              <Link to={isLoggedIn ? dashboardHref : "/login"}>
                <Button className="bg-background text-foreground hover:bg-background/90">
                  {isLoggedIn ? "Go to dashboard" : "Sign in"}
                </Button>
              </Link>
              <Link to="/contact"><Button variant="outline" className="border-background/60 text-foreground hover:bg-background/15">Talk to sales</Button></Link>
            </div>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  )
}
