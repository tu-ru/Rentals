import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { useToast } from "../../../components/ui/toast"
import { supabase } from "../../../lib/supabase/client"
import { handleSupabaseError } from "../../../lib/utils/errors"
import * as authService from "../../auth/services/authService"
import {
  useAgentPropertyAssignments,
  useOrganizationProperties,
  useOrganizationSettings,
  useReplaceAgentAssignments,
  useTeamMembers,
  useUpdateOrganizationSettings,
  useUpdateTeamMemberStatus,
} from "../hooks"
import type { NotificationPreferences, SmsAutomationPreferences, StaffInviteInput, SubscriptionPlan } from "../types"

const plans: SubscriptionPlan[] = ["free", "starter", "pro", "enterprise"]
const defaultNotificationPrefs: NotificationPreferences = {
  rent_reminder: true,
  payment_confirmed: true,
  maintenance_update: true,
  lease_expiry: true,
  general: true,
}

const defaultSmsAutomation: SmsAutomationPreferences = {
  welcome: true,
  rent_reminder: true,
  overdue_notice: true,
  payment_confirmed: true,
  maintenance_update: true,
  lease_expiry: true,
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
}

export function OrganizationSettingsPanel() {
  const { profile } = useAuth()
  const { data: organization } = useOrganizationSettings()
  const { data: teamMembers = [] } = useTeamMembers()
  const { data: propertyOptions = [] } = useOrganizationProperties()
  const { data: agentAssignments = [] } = useAgentPropertyAssignments()
  const updateOrganization = useUpdateOrganizationSettings()
  const updateMemberStatus = useUpdateTeamMemberStatus()
  const replaceAgentAssignments = useReplaceAgentAssignments()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free")
  const [currency, setCurrency] = useState("KES")
  const [timezone, setTimezone] = useState("Africa/Nairobi")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(defaultNotificationPrefs)

  const [smsApiKey, setSmsApiKey] = useState("")
  const [smsPartnerId, setSmsPartnerId] = useState("")
  const [smsShortcode, setSmsShortcode] = useState("")
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState("")
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState("")
  const [smsAutomation, setSmsAutomation] = useState<SmsAutomationPreferences>(defaultSmsAutomation)
  const [smsTestStatus, setSmsTestStatus] = useState<string | null>(null)
  const [smsTesting, setSmsTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showMpesaSecret, setShowMpesaSecret] = useState(false)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"landlord" | "admin" | "agent">("agent")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])

  useEffect(() => {
    if (!organization) return

    setName(organization.name)
    setSlug(organization.slug)
    setLogoUrl(organization.logo_url ?? "")
    setSubscriptionPlan((organization.subscription_plan as SubscriptionPlan) ?? "free")

    const settings = (organization.settings ?? {}) as Record<string, unknown>
    setCurrency((settings.currency as string) ?? "KES")
    setTimezone((settings.timezone as string) ?? "Africa/Nairobi")
    setDateFormat((settings.date_format as string) ?? "DD/MM/YYYY")

    const prefs = (settings.notification_preferences ?? {}) as Partial<NotificationPreferences>
    setNotificationPrefs({ ...defaultNotificationPrefs, ...prefs })

    setSmsApiKey((settings.sms_api_key as string) ?? "")
    setSmsPartnerId((settings.sms_partner_id as string) ?? "")
    setSmsShortcode((settings.sms_shortcode as string) ?? "")
    setMpesaConsumerKey((settings.mpesa_consumer_key as string) ?? "")
    setMpesaConsumerSecret((settings.mpesa_consumer_secret as string) ?? "")
    const smsPrefs = (settings.sms_automation ?? {}) as Partial<SmsAutomationPreferences>
    setSmsAutomation({ ...defaultSmsAutomation, ...smsPrefs })
  }, [organization])

  const canManageTeam = profile?.role === "admin" || profile?.role === "landlord"
  const canInviteStaff = false

  const submitOrganization = async () => {
    if (!organization || !name.trim()) return

    const baseSettings = (organization.settings ?? {}) as Record<string, unknown>

    await updateOrganization.mutateAsync({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      logo_url: logoUrl.trim() || null,
      subscription_plan: subscriptionPlan,
      settings: {
        ...baseSettings,
        currency: currency.trim() || "KES",
        timezone: timezone.trim() || "Africa/Nairobi",
        date_format: dateFormat.trim() || "DD/MM/YYYY",
        notification_preferences: notificationPrefs,
        mpesa_consumer_key: mpesaConsumerKey.trim() || undefined,
        mpesa_consumer_secret: mpesaConsumerSecret.trim() || undefined,
        sms_api_key: smsApiKey.trim() || undefined,
        sms_partner_id: smsPartnerId.trim() || undefined,
        sms_shortcode: smsShortcode.trim() || undefined,
        sms_automation: smsAutomation,
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

      await authService.inviteUser({
        email: payload.email,
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
  const agents = useMemo(() => teamMembers.filter((member) => member.role === "agent"), [teamMembers])
  const assignmentsByAgent = useMemo(() => {
    const out = new Map<string, Array<{ id: string; property_id: string; property_name: string }>>()
    for (const assignment of agentAssignments) {
      if (!out.has(assignment.agent_id)) out.set(assignment.agent_id, [])
      out.get(assignment.agent_id)!.push({
        id: assignment.id,
        property_id: assignment.property_id,
        property_name: assignment.property_name,
      })
    }
    return out
  }, [agentAssignments])

  useEffect(() => {
    if (!selectedAgentId) {
      setSelectedPropertyIds([])
      return
    }
    const assigned = assignmentsByAgent.get(selectedAgentId) ?? []
    setSelectedPropertyIds(assigned.map((item) => item.property_id))
  }, [assignmentsByAgent, selectedAgentId])

  const togglePreference = (key: keyof NotificationPreferences) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSms = (key: keyof SmsAutomationPreferences) => {
    setSmsAutomation((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const testSmsConnection = async () => {
    setSmsTesting(true)
    setSmsTestStatus(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sms-balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Connection failed")
      setSmsTestStatus(`Connected - Balance: ${data.balance} ${data.currency}`)
    } catch (error) {
      setSmsTestStatus(String(error))
      toast({ title: "SMS connection failed", description: String(error), variant: "destructive" })
    } finally {
      setSmsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(
                [
                  { key: "rent_reminder", label: "Rent reminders" },
                  { key: "payment_confirmed", label: "Payment confirmations" },
                  { key: "maintenance_update", label: "Maintenance updates" },
                  { key: "lease_expiry", label: "Lease expiry alerts" },
                  { key: "general", label: "General notifications" },
                ] as Array<{ key: keyof NotificationPreferences; label: string }>
              ).map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-md border p-3">
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs[item.key]}
                    onChange={() => togglePreference(item.key)}
                  />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS and M-Pesa credentials</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>M-Pesa consumer key</Label>
                <Input value={mpesaConsumerKey} onChange={(e) => setMpesaConsumerKey(e.target.value)} placeholder="Daraja consumer key" />
              </div>
              <div>
                <Label>M-Pesa consumer secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showMpesaSecret ? "text" : "password"}
                    value={mpesaConsumerSecret}
                    onChange={(e) => setMpesaConsumerSecret(e.target.value)}
                    placeholder="Daraja consumer secret"
                  />
                  <Button type="button" variant="outline" onClick={() => setShowMpesaSecret((v) => !v)}>
                    {showMpesaSecret ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
              <div>
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input type={showApiKey ? "text" : "password"} value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} />
                  <Button type="button" variant="outline" onClick={() => setShowApiKey((v) => !v)}>
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Partner ID</Label>
                <Input value={smsPartnerId} onChange={(e) => setSmsPartnerId(e.target.value)} />
              </div>
              <div>
                <Label>Sender ID / Shortcode</Label>
                <Input value={smsShortcode} onChange={(e) => setSmsShortcode(e.target.value)} placeholder="RENTMS" />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => void testSmsConnection()} disabled={smsTesting}>
                  {smsTesting ? "Testing..." : "Test Connection"}
                </Button>
                <Button disabled={updateOrganization.isPending} onClick={() => void submitOrganization()}>
                  Save Credential Settings
                </Button>
              </div>
              <p className="text-sm text-muted-foreground md:col-span-2">
                M-Pesa and SMS credentials are stored per organization so each tester or landlord can use separate provider accounts.
              </p>
              {smsTestStatus && <p className="text-sm text-muted-foreground">{smsTestStatus}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(
                [
                  { key: "welcome", label: "Send welcome SMS to new tenants" },
                  { key: "rent_reminder", label: "Monthly rent reminders (3 days before)" },
                  { key: "overdue_notice", label: "Overdue payment alerts" },
                  { key: "payment_confirmed", label: "Payment confirmation SMS" },
                  { key: "maintenance_update", label: "Maintenance status updates" },
                  { key: "lease_expiry", label: "Lease expiry warnings (30 days before)" },
                ] as Array<{ key: keyof SmsAutomationPreferences; label: string }>
              ).map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-md border p-3">
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={smsAutomation[item.key]}
                    onChange={() => toggleSms(item.key)}
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/dashboard/sms" className="text-sm text-primary">Manage SMS Templates</Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Active team members: {activeTeam}</p>

              {canInviteStaff && (
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

              {canManageTeam && (
                <div className="space-y-3 rounded-md border p-4">
                  <div>
                    <Label>Agent property assignments</Label>
                    <p className="text-sm text-muted-foreground">Assign agents only to the properties they should operate on.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Select agent</Label>
                      <Select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>
                        <option value="">Choose an agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>{agent.full_name ?? agent.id}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Assigned properties</Label>
                      <div className="max-h-44 space-y-2 overflow-auto rounded-md border p-3">
                        {propertyOptions.map((property) => {
                          const checked = selectedPropertyIds.includes(property.id)
                          return (
                            <label key={property.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedPropertyIds((prev) =>
                                    checked ? prev.filter((id) => id !== property.id) : [...prev, property.id],
                                  )
                                }
                              />
                              <span>{property.name}</span>
                            </label>
                          )
                        })}
                        {!propertyOptions.length && <p className="text-sm text-muted-foreground">No properties available yet.</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={!selectedAgentId || replaceAgentAssignments.isPending}
                      onClick={() => void replaceAgentAssignments.mutateAsync({ agentId: selectedAgentId, propertyIds: selectedPropertyIds })}
                    >
                      {replaceAgentAssignments.isPending ? "Saving assignments..." : "Save agent assignments"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{member.full_name || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground">{member.role} - {member.phone ?? "No phone"}</p>
                      {member.role === "agent" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Assigned properties: {(assignmentsByAgent.get(member.id) ?? []).map((item) => item.property_name).join(", ") || "None"}
                        </p>
                      )}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
