import { motion } from "framer-motion"
import { MarketingLayout } from "../../components/layouts"
import { Button } from "../../components/ui/button"

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function PricingPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.5 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            Pricing tailored to your portfolio.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            We offer flexible, usage-based pricing aligned with your unit count and operational needs. Contact us for a custom plan and onboarding roadmap.
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
            className="grid gap-8 lg:grid-cols-[1fr_1fr]"
          >
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <h2 className="text-2xl font-semibold">Contact for pricing</h2>
              <p className="mt-3 text-muted-foreground">Email: pricing@rentms.co.ke</p>
              <p className="text-muted-foreground">Phone: +254 700 123 456</p>
              <p className="text-muted-foreground">Office: Westlands, Nairobi</p>
              <Button className="mt-4">Request pricing</Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">What the plan includes</h3>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li>Full tenant portal and communication suite</li>
                <li>Unlimited invoices and payment tracking</li>
                <li>Maintenance workflows with staff assignment</li>
                <li>SMS automation + delivery tracking</li>
                <li>Analytics dashboards and CSV export</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  )
}
