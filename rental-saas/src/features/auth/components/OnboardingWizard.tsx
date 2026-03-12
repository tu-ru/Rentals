import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Progress } from "../../../components/ui/progress"

const total = 4

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { organization } = useAuth()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  const next = () => {
    setDirection(1)
    setStep((s) => Math.min(total, s + 1))
  }

  const back = () => {
    setDirection(-1)
    setStep((s) => Math.max(1, s - 1))
  }

  return (
    <div className="space-y-6">
      <Progress value={(step / total) * 100} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {step === 1 && (
            <>
              <h3 className="text-lg font-semibold">Welcome to RentMS</h3>
              <p className="text-sm text-muted-foreground">Confirm your organization details to proceed.</p>
              <div>
                <Label>Organization name</Label>
                <Input defaultValue={organization?.name ?? ""} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold">Configure M-Pesa</h3>
              <div>
                <Label>Shortcode</Label>
                <Input placeholder="174379" />
              </div>
              <div>
                <Label>Nominated number</Label>
                <Input placeholder="07XXXXXXXX" />
              </div>
              <div>
                <Label>Environment</Label>
                <div className="mt-2 flex gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mpesa_env" defaultChecked /> Sandbox
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mpesa_env" /> Production
                  </label>
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={next}>
                Skip for now
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold">Add first property</h3>
              <div>
                <Label>Name</Label>
                <Input placeholder="Kilimani Heights" />
              </div>
              <div>
                <Label>Type</Label>
                <Input placeholder="Apartment" />
              </div>
              <div>
                <Label>Address</Label>
                <Input placeholder="Ole Dume Road" />
              </div>
              <div>
                <Label>City</Label>
                <Input placeholder="Nairobi" />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-lg font-semibold">You&apos;re all set</h3>
              <p className="text-sm text-muted-foreground">Your workspace is ready. Continue to your dashboard.</p>
              <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back} disabled={step === 1}>
          Back
        </Button>
        {step < total && (
          <Button type="button" onClick={next}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
