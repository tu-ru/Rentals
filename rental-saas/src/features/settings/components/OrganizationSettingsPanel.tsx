import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { handleSupabaseError } from "../../../lib/utils/errors"
import { useOrganizationSettings, useTeamMembers, useUpdateOrganizationSettings, useUpdateTeamMemberStatus } from "../hooks"
import type { StaffInviteInput, SubscriptionPlan } from "../types"

const plans: SubscriptionPlan[] = ["free", "starter", "pro", "enterprise"]

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
}

export function OrganizationSettingsPanel() {
  const { profile, sendMagicLink } = useAuth()
  const { data: organization } = useOrganizationSettings()
  const { data: teamMembers = [] } = useTeamMembers()
  const updateOrganization = useUpdateOrganizationSettings()
  const updateMemberStatus = useUpdateTeamMemberStatus()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free")
  const [currency, setCurrency] = useState("KES")
  const [timezone, setTimezone] = useState("Africa/Nairobi")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!organization) return

    setName(organization.name)
    setSlug(organization.slug)
    setLogoUrl(organization.logo_url ?? "")
    setSubscriptionPlan((organization.subscription_plan as SubscriptionPlan) ?? "free")

    const settings = (organization.settings ?? {}) as Record<string, string>
    setCurrency(settings.currency ?? "KES")
    setTimezone(settings.timezone ?? "Africa/Nairobi")
    setDateFormat(settings.date_format ?? "DD/MM/YYYY")
  }, [organization])

  const canManageTeam = profile?.role === "admin" || profile?.role === "landlord"

  const submitOrganization = async () => {
    if (!organization || !name.trim()) return

    await updateOrganization.mutateAsync({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      logo_url: logoUrl.trim() || null,
      subscription_plan: subscriptionPlan,
      settings: {
        currency: currency.trim() || "KES",
        timezone: timezone.trim() || "Africa/Nairobi",
        date_format: dateFormat.trim() || "DD/MM/YYYY",
      },
    })
  }

  const inviteStaff = async () => {
    if (!canManageTeam || !inviteEmail.trim() || !profile?.organization_id) return

    setInviting(true)
    setInviteError(null)
    setInviteStatus(null)

    try {
      const payload: StaffInviteInput = {
        email: inviteEmail.trim(),
        role: inviteRole,
      }

      await sendMagicLink(payload.email, {
        role: payload.role,
        organization_id: profile.organization_id,
      })

      setInviteStatus(`Invite sent to ${payload.email}`)
      setInviteEmail("")
    } catch (error) {
      setInviteError(handleSupabaseError(error))
    } finally {
      setInviting(false)
    }
  }

  const activeTeam = useMemo(() => teamMembers.filter((member) => member.is_active).length, [teamMembers])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label>Subscription plan</Label>
            <Select value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value as SubscriptionPlan)}>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={currency} onChange={(event) => setCurrency(event.target.value)} />
          </div>
          <div>
            <Label>Timezone</Label>
            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          </div>
          <div>
            <Label>Date format</Label>
            <Input value={dateFormat} onChange={(event) => setDateFormat(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button disabled={updateOrganization.isPending} onClick={() => void submitOrganization()}>
              {updateOrganization.isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Active team members: {activeTeam}</p>

          {canManageTeam && (
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="staff@example.com"
              />
              <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as "admin" | "agent")}>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
              </Select>
              <Button disabled={inviting || !inviteEmail.trim()} onClick={() => void inviteStaff()}>
                {inviting ? "Inviting..." : "Invite staff"}
              </Button>
            </div>
          )}

          {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
          {inviteStatus && <p className="text-sm text-emerald-600">{inviteStatus}</p>}

          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{member.full_name || "Unnamed user"}</p>
                  <p className="text-xs text-muted-foreground">{member.role} · {member.phone ?? "No phone"}</p>
                </div>
                <Button
                  variant={member.is_active ? "outline" : "default"}
                  disabled={!canManageTeam || updateMemberStatus.isPending || member.role === "landlord"}
                  onClick={() => void updateMemberStatus.mutateAsync({ memberId: member.id, isActive: !member.is_active })}
                >
                  {member.is_active ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
