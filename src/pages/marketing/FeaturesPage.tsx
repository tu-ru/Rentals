import { motion } from "framer-motion"
import { MarketingLayout } from "../../components/layouts"

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const features = [
  {
    title: "Property and Unit Management",
    body:
      "Register properties, configure unit types, and maintain accurate occupancy status. Each unit carries rent, amenities, and lifecycle state so teams can plan vacancies, renewals, and inspections without manual spreadsheets.",
  },
  {
    title: "Lease Lifecycle",
    body:
      "Create, renew, or terminate leases with automated invoice creation. Lease status syncs with unit availability to prevent double-booking and keeps operations aligned across teams.",
  },
  {
    title: "Tenant Self-Service",
    body:
      "Tenants see balances, invoices, and payment history. They can download invoices, log maintenance requests with photos, and message support. Mobile-first design keeps everything accessible on phones.",
  },
  {
    title: "Invoices and Billing",
    body:
      "Generate invoices with line items, due dates, and balance tracking. Automated reminders keep collections on schedule, while invoice statuses show exactly where revenue stands.",
  },
  {
    title: "M-Pesa and Payment Reconciliation",
    body:
      "Record payments manually or reconcile M-Pesa transactions. Payment entries update invoice balances and collection rate metrics, preserving an accurate ledger without manual adjustment.",
  },
  {
    title: "Maintenance Operations",
    body:
      "Tenants submit requests with category, priority, and up to five photos. Admins assign staff, manage queues with a Kanban board, and enforce resolution notes to close requests properly.",
  },
  {
    title: "Messaging and Collaboration",
    body:
      "In-app messaging connects tenants with landlords or agents. Conversations are tied to tenant context so issue history and follow-ups are easy to track.",
  },
  {
    title: "Analytics and Reports",
    body:
      "Interactive dashboards show revenue MTD, occupancy, collection rates, and maintenance workload. Exportable CSV reports support audits and financial reviews.",
  },
  {
    title: "Notifications and SMS",
    body:
      "In-app notifications deliver real-time updates, while Celcom Africa SMS automation keeps tenants informed about rent reminders, overdue notices, and payment confirmations.",
  },
  {
    title: "Roles and Governance",
    body:
      "Role-based access for admins, landlords, agents, and tenants ensures data visibility is controlled. Every operational update is logged for accountability and compliance.",
  },
]

export function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.5 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Features</p>
          <h1 className="mt-3 text-4xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            Every feature designed for modern rental operations.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            K535 covers the full operational lifecycle from leasing to maintenance, with the analytics and automation you need to keep your portfolio healthy.
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
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  )
}
