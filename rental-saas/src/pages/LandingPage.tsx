import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { MarketingLayout } from "../components/layouts"
import { useAuth } from "../app/providers"
import type { UserRole } from "../types/auth.types"

const highlights = [
  {
    title: "Organized communication",
    body: "Messages, notices, and reminders stay visible to the whole team.",
  },
  {
    title: "Clear cash flow",
    body: "Invoices, payments, balances, and arrears stay aligned.",
  },
  {
    title: "Better follow-through",
    body: "Teams can see what still needs action.",
  },
]

const focusPoints = [
  "Track tenant communication clearly.",
  "Keep rent and arrears visible.",
  "Give tenants one clear channel.",
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
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Property control with a narrower focus</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-6xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Clear messaging. Clear cash flow.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              K535 helps rental teams reduce communication gaps and understand money movement faster.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={isLoggedIn ? dashboardHref : "/login"}>
                <Button className="px-6">{isLoggedIn ? "Go to dashboard" : "Sign in"}</Button>
              </Link>
              <Link to="/features"><Button variant="outline" className="px-6">Explore features</Button></Link>
            </div>
            <div className="mt-10 rounded-3xl border border-border bg-card/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">What the platform helps you control</p>
              <div className="mt-5 grid gap-4">
                {focusPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
                    <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    <p className="text-sm text-muted-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-border bg-card/80 p-6 shadow-xl"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">A simpler view</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tenant Messaging</p>
                <p className="mt-3 text-2xl font-semibold">Send reminders, notices, and updates without losing the thread.</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cash Visibility</p>
                <p className="mt-3 text-2xl font-semibold">Track invoices, payments, and reconciliation in one clear view.</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Follow-up</p>
                <p className="mt-3 text-2xl font-semibold">See who still needs a message, a payment, or a response.</p>
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
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Why K535</p>
              <h2 className="mt-3 text-3xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
                Built for communication discipline and financial transparency.
              </h2>
              <p className="mt-4 text-muted-foreground">
                It focuses on the parts of rental operations that break trust fastest: unclear tenant communication and unclear money movement.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <p className="text-sm font-semibold">Explore the product focus</p>
              <p className="mt-2 text-sm text-muted-foreground">See how communication workflows and payment visibility fit together.</p>
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
                Start with a clearer operating rhythm.
              </h2>
            </div>
            <div className="flex gap-3">
              <Link to={isLoggedIn ? dashboardHref : "/login"}>
                <Button className="bg-background text-foreground hover:bg-background/90">
                  {isLoggedIn ? "Go to dashboard" : "Sign in"}
                </Button>
              </Link>
              <Link to="/contact"><Button variant="outline" className="border-background/60 text-foreground hover:bg-background/15">Request access</Button></Link>
            </div>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  )
}
