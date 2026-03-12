import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../app/providers"
import { supabase } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Progress } from "../../../components/ui/progress"
import * as authService from "../services/authService"
import * as propertyService from "../../properties/services/propertyService"
import { handleSupabaseError } from "../../../lib/utils/errors"

const total = 4

type PropertyType = "apartment" | "house" | "commercial" | "bedsitter" | "single_room" | "studio"

function roleHome(role?: string | null) {
  if (role === "tenant") return "/tenant"
  if (role === "agent") return "/agent"
  return "/dashboard"
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { user, profile, organization, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [organizationName, setOrganizationName] = useState(organization?.name ?? "")
  const [mpesaShortcode, setMpesaShortcode] = useState(organization?.mpesa_shortcode ?? "")
  const [mpesaNominatedNumber, setMpesaNominatedNumber] = useState(organization?.mpesa_nominated_number ?? "")
  const [mpesaEnv, setMpesaEnv] = useState<"sandbox" | "production">(organization?.mpesa_env ?? "sandbox")

  const [propertyName, setPropertyName] = useState("")
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment")
  const [propertyAddress, setPropertyAddress] = useState("")
  const [propertyCity, setPropertyCity] = useState("Nairobi")

  const canCreateProperty = useMemo(() => profile?.role === "landlord" || profile?.role === "admin", [profile?.role])

  const next = () => {
    if (step === 1 && !organizationName.trim()) {
      setSubmitError("Organization name is required.")
      return
    }

    if (step === 3 && canCreateProperty) {
      const hasAnyField = propertyName.trim() || propertyAddress.trim() || propertyCity.trim()
      if (hasAnyField && (!propertyName.trim() || !propertyAddress.trim() || !propertyCity.trim())) {
        setSubmitError("To add your first property, fill Name, Address and City.")
        return
      }
    }

    setSubmitError(null)
    setDirection(1)
    setStep((s) => Math.min(total, s + 1))
  }

  const back = () => {
    setSubmitError(null)
    setDirection(-1)
    setStep((s) => Math.max(1, s - 1))
  }

  const finishOnboarding = async () => {
    if (!user || !profile) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      let organizationId = profile.organization_id

      if (!organizationId) {
        const createdOrg = await authService.createOrganization(organizationName.trim(), user.id)
        organizationId = createdOrg.id
      }

      const { error: orgUpdateError } = await supabase
        .from("organizations")
        .update({
          name: organizationName.trim(),
          mpesa_shortcode: mpesaShortcode.trim() || null,
          mpesa_nominated_number: mpesaNominatedNumber.trim() || null,
          mpesa_env: mpesaEnv,
        })
        .eq("id", organizationId)
      if (orgUpdateError) throw orgUpdateError

      if (profile.organization_id !== organizationId) {
        await authService.updateProfile(user.id, { organization_id: organizationId })
      }

      if (canCreateProperty && propertyName.trim() && propertyAddress.trim() && propertyCity.trim()) {
        await propertyService.createProperty(
          {
            name: propertyName.trim(),
            property_type: propertyType,
            address: propertyAddress.trim(),
            city: propertyCity.trim(),
            county: propertyCity.trim(),
            total_units: 0,
            occupied_units: 0,
            amenities: [],
            images: [],
            is_active: true,
          },
          organizationId,
        )
      }

      await refreshProfile()
      navigate(roleHome(profile.role), { replace: true })
    } catch (error) {
      setSubmitError(handleSupabaseError(error))
    } finally {
      setSubmitting(false)
    }
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
                <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold">Configure M-Pesa</h3>
              <div>
                <Label>Shortcode</Label>
                <Input placeholder="174379" value={mpesaShortcode} onChange={(e) => setMpesaShortcode(e.target.value)} />
              </div>
              <div>
                <Label>Nominated number</Label>
                <Input
                  placeholder="07XXXXXXXX"
                  value={mpesaNominatedNumber}
                  onChange={(e) => setMpesaNominatedNumber(e.target.value)}
                />
              </div>
              <div>
                <Label>Environment</Label>
                <div className="mt-2 flex gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mpesa_env"
                      checked={mpesaEnv === "sandbox"}
                      onChange={() => setMpesaEnv("sandbox")}
                    />
                    Sandbox
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mpesa_env"
                      checked={mpesaEnv === "production"}
                      onChange={() => setMpesaEnv("production")}
                    />
                    Production
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold">Add first property</h3>
              <p className="text-sm text-muted-foreground">
                {canCreateProperty
                  ? "Optional: add your first property now."
                  : "Your role does not require creating properties during onboarding."}
              </p>
              <div>
                <Label>Name</Label>
                <Input placeholder="Kilimani Heights" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="single_room">Single room</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div>
                <Label>Address</Label>
                <Input placeholder="Ole Dume Road" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input placeholder="Nairobi" value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-lg font-semibold">You&apos;re all set</h3>
              <p className="text-sm text-muted-foreground">Your workspace is ready. Continue to your dashboard.</p>
              <Button onClick={() => void finishOnboarding()} disabled={submitting}>
                {submitting ? "Finishing setup..." : "Go to Dashboard"}
              </Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back} disabled={step === 1 || submitting}>
          Back
        </Button>
        {step < total && (
          <Button type="button" onClick={next} disabled={submitting}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
