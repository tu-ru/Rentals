import { motion } from "framer-motion"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { MarketingLayout } from "../../components/layouts"
import { Button } from "../../components/ui/button"
import { useToast } from "../../components/ui/toast"
import { supabase } from "../../lib/supabase/client"

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function ContactPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    portfolioSize: "",
    message: "",
  })

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        portfolio_size: form.portfolioSize.trim() || null,
        message: form.message.trim(),
        source: "contact_page",
      })
      if (error) throw error

      toast({
        title: "Message sent",
        description: "Thanks for reaching out. Our team will reply within 24 hours.",
      })
      setForm({ fullName: "", email: "", portfolioSize: "", message: "" })
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.5 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            Talk to our team.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Tell us about your portfolio and goals. Our team will respond within 24 hours with a tailored plan.
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
            className="grid gap-10 lg:grid-cols-[1fr_1fr]"
          >
            <div>
              <h2 className="text-2xl font-semibold">Contact details</h2>
              <p className="mt-3 text-muted-foreground">Support: support@rentms.co.ke</p>
              <p className="text-muted-foreground">Sales: hello@rentms.co.ke</p>
              <p className="text-muted-foreground">Phone: +254 711 987 654</p>
              <p className="text-muted-foreground">Office: Upper Hill, Nairobi</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="contact-name" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Full name</label>
                  <input
                    id="contact-name"
                    name="fullName"
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Jane Mwangi"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Work email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="jane@company.co.ke"
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>
                <div>
                  <label htmlFor="contact-portfolio" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portfolio size</label>
                  <input
                    id="contact-portfolio"
                    name="portfolioSize"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="120 units"
                    value={form.portfolioSize}
                    onChange={handleChange("portfolioSize")}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    className="mt-2 min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Tell us about your goals"
                    value={form.message}
                    onChange={handleChange("message")}
                  />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send message"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  )
}
