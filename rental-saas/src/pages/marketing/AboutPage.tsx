import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { MarketingLayout } from "../../components/layouts"

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const values = [
  {
    title: "Operational clarity",
    body: "We eliminate ambiguity by connecting leases, payments, maintenance, and communications in a single operational record.",
  },
  {
    title: "Tenant experience",
    body: "A self-service portal reduces friction for tenants and keeps your support team focused on high-impact work.",
  },
  {
    title: "Financial discipline",
    body: "RentMS keeps invoices, payments, and receipts in lockstep to reduce leakage and improve collection rates.",
  },
  {
    title: "Scalable workflows",
    body: "Standardize processes for new properties, new staff, and new tenants without re-training the team.",
  },
]

export function AboutPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.5 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">About</p>
          <h1 className="mt-3 text-4xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            A rental operating system built for Kenyan property teams.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            RentMS Kenya was designed for landlords and agents managing growing portfolios. Our focus is operational clarity: everyone on the team can see what is owed, what is resolved, and what needs immediate action.
          </p>
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
            className="grid gap-6 md:grid-cols-2"
          >
            {values.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.body}</p>
              </div>
            ))}
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
          className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Our mission</p>
            <h2 className="mt-3 text-3xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>How we help your team scale</h2>
            <p className="mt-4 text-muted-foreground">
              We help teams replace fragmented spreadsheets with a structured system. RentMS shows occupancy, collections, and maintenance workloads in real time so managers can allocate resources where they matter most.
            </p>
            <p className="mt-4 text-muted-foreground">
              Automation handles reminders, SMS notifications, and reporting while your team focuses on tenant relationships and property performance.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Our promise</p>
            <p className="mt-4 text-muted-foreground">
              You will always know what is happening across your portfolio and which actions move the needle.
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">Want the full feature breakdown?</p>
              <p className="mt-2 text-sm text-muted-foreground">Explore detailed workflows and feature deep dives.</p>
              <Link to="/features" className="mt-3 inline-flex text-sm font-medium text-primary">Go to Features</Link>
            </div>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  )
}
