import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../app/providers"
import { supabase } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Progress } from "../../../components/ui/progress"
import * as propertyService from "../../properties/services/propertyService"
import * as tenantService from "../../tenants/services/tenantService"
import { handleSupabaseError } from "../../../lib/utils/errors"

const total = 5

type PropertyType = "apartment" | "house" | "commercial" | "bedsitter" | "single_room" | "studio"

function roleHome(role?: string | null) {
  if (role === "tenant") return "/tenant"
  if (role === "agent") return "/agent"
  if (role === "super_admin") return "/super-admin"
  return "/dashboard"
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { user, profile, organization, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)

  const [organizationName, setOrganizationName] = useState(
    organization?.name ?? (typeof user?.user_metadata?.organization_name === "string" ? user.user_metadata.organization_name : ""),
  )
  const [mpesaShortcode, setMpesaShortcode] = useState(organization?.mpesa_shortcode ?? "")
  const [mpesaNominatedNumber, setMpesaNominatedNumber] = useState(organization?.mpesa_nominated_number ?? "")
  const [mpesaEnv, setMpesaEnv] = useState<"sandbox" | "production">(organization?.mpesa_env ?? "sandbox")
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState(
    (((organization?.settings as Record<string, unknown> | undefined)?.mpesa_consumer_key as string) ?? ""),
  )
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState(
    (((organization?.settings as Record<string, unknown> | undefined)?.mpesa_consumer_secret as string) ?? ""),
  )
  const [smsAutoWelcome, setSmsAutoWelcome] = useState(
    ((organization?.settings as any)?.sms_automation?.welcome ?? true) as boolean,
  )

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

  const handleTenantInvite = async () => {
    const organizationId = profile?.organization_id ?? organization?.id
    if (!inviteEmail.trim() || !organizationId) return

    setSubmitting(true)
    setSubmitError(null)
    setInviteStatus(null)

    try {
      await tenantService.inviteTenant(inviteEmail.trim(), inviteEmail.trim().split("@")[0], "", undefined, organizationId)
      setInviteStatus("Invite link sent successfully.")
      setInviteEmail("")
    } catch (error) {
      setSubmitError(handleSupabaseError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const finishOnboarding = async () => {
    if (!user || !profile) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const organizationId = profile.organization_id
      if (!organizationId) throw new Error("Your account is not assigned to an organization. Contact a super admin.")

      const { error: orgUpdateError } = await supabase
        .from("organizations")
        .update({
          name: organizationName.trim(),
          mpesa_shortcode: mpesaShortcode.trim() || null,
          mpesa_nominated_number: mpesaNominatedNumber.trim() || null,
          mpesa_env: mpesaEnv,
          settings: {
            ...((organization?.settings as Record<string, any>) ?? {}),
            onboarding_state: "complete",
            mpesa_consumer_key: mpesaConsumerKey.trim() || undefined,
            mpesa_consumer_secret: mpesaConsumerSecret.trim() || undefined,
            sms_automation: {
              ...(((organization?.settings as Record<string, any>) ?? {})?.sms_automation ?? {}),
              welcome: smsAutoWelcome,
            },
          },
        })
        .eq("id", organizationId)
      if (orgUpdateError) throw orgUpdateError

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
                <Label>Consumer key</Label>
                <Input
                  placeholder="Daraja consumer key"
                  value={mpesaConsumerKey}
                  onChange={(e) => setMpesaConsumerKey(e.target.value)}
                />
              </div>
              <div>
                <Label>Consumer secret</Label>
                <Input
                  type="password"
                  placeholder="Daraja consumer secret"
                  value={mpesaConsumerSecret}
                  onChange={(e) => setMpesaConsumerSecret(e.target.value)}
                />
              </div>
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={smsAutoWelcome}
                  onChange={(event) => setSmsAutoWelcome(event.target.checked)}
                />
                When new tenants are added, automatically send them their Paybill details via SMS
              </label>
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
              <h3 className="text-lg font-semibold">Invite your first tenant</h3>
              <p className="text-sm text-muted-foreground">Send a magic link invite so a tenant can access their portal.</p>
              <p className="text-xs text-muted-foreground">Tenant accounts are invite-only and stay bound to your organization.</p>
              <div>
                <Label>Tenant email</Label>
                <Input
                  type="email"
                  placeholder="tenant@example.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
              </div>
              <Button type="button" variant="outline" disabled={submitting || !inviteEmail.trim()} onClick={() => void handleTenantInvite()}>
                {submitting ? "Sending invite..." : "Send tenant invite"}
              </Button>
              {inviteStatus && <p className="text-sm text-emerald-600">{inviteStatus}</p>}
            </>
          )}

          {step === 5 && (
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
