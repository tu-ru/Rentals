import { useMemo, useState } from "react"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import {
  useArchiveOrganizationAsSuperAdmin,
  useAuditLogs,
  useDeleteOrganizationAsSuperAdmin,
  useDeleteUserAsSuperAdmin,
  useInvitations,
  usePlatformOrganizations,
  usePlatformUsers,
  useProvisionOrganization,
  useReassignUser,
  useResendInvitation,
  useRestoreOrganizationAsSuperAdmin,
  useRevokeInvitation,
  useSetPlatformUserActiveState,
} from "../hooks"
import type { PlatformUserSummary, ProvisionOrganizationInput, SubscriptionPlan } from "../types"

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/\s+/g, "-")
}

const plans: SubscriptionPlan[] = ["free", "starter", "pro", "enterprise"]

export function SuperAdminPanel() {
  const { profile } = useAuth()
  const { data: organizations = [] } = usePlatformOrganizations()
  const { data: invitations = [] } = useInvitations()
  const { data: users = [] } = usePlatformUsers()
  const { data: auditLogs = [] } = useAuditLogs()
  const provisionOrganization = useProvisionOrganization()
  const revokeInvitation = useRevokeInvitation()
  const resendInvitation = useResendInvitation()
  const reassignUser = useReassignUser()
  const setPlatformUserActiveState = useSetPlatformUserActiveState()
  const archiveOrganization = useArchiveOrganizationAsSuperAdmin()
  const restoreOrganization = useRestoreOrganizationAsSuperAdmin()
  const deleteOrganization = useDeleteOrganizationAsSuperAdmin()
  const deleteUser = useDeleteUserAsSuperAdmin()

  const [organizationName, setOrganizationName] = useState("")
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("starter")
  const [landlordName, setLandlordName] = useState("")
  const [landlordEmail, setLandlordEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")

  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedUserRole, setSelectedUserRole] = useState<"landlord" | "admin" | "agent" | "tenant">("admin")
  const [selectedUserOrgId, setSelectedUserOrgId] = useState("")

  const [organizationDeleteId, setOrganizationDeleteId] = useState("")
  const [organizationDeleteName, setOrganizationDeleteName] = useState("")
  const [userDeleteId, setUserDeleteId] = useState("")

  const pendingInvites = useMemo(
    () => invitations.filter((invite) => invite.status === "sent" || invite.status === "pending"),
    [invitations],
  )

  const manageableUsers = useMemo(
    () => users.filter((user) => user.role !== "super_admin"),
    [users],
  )

  const adminUsers = useMemo(
    () => users.filter((user) => user.role === "landlord" || user.role === "admin" || user.role === "agent"),
    [users],
  )

  const selectedUser = useMemo(
    () => manageableUsers.find((user) => user.id === selectedUserId) ?? null,
    [manageableUsers, selectedUserId],
  )

  if (profile?.role !== "super_admin") {
    return (
      <Card>
        <CardHeader><CardTitle>Platform access required</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This area is restricted to super admins.
        </CardContent>
      </Card>
    )
  }

  const handleProvision = async () => {
    const payload: ProvisionOrganizationInput = {
      organization_name: organizationName.trim(),
      slug: slugify(organizationName),
      subscription_plan: subscriptionPlan,
      landlord_email: landlordEmail.trim(),
      landlord_name: landlordName.trim(),
      admin_email: adminEmail.trim() || undefined,
      admin_name: adminName.trim() || undefined,
    }

    await provisionOrganization.mutateAsync(payload)

    setOrganizationName("")
    setSubscriptionPlan("starter")
    setLandlordName("")
    setLandlordEmail("")
    setAdminName("")
    setAdminEmail("")
  }

  const handleLoadUser = (user: PlatformUserSummary) => {
    setSelectedUserId(user.id)
    setSelectedUserRole(user.role === "landlord" || user.role === "admin" || user.role === "agent" || user.role === "tenant" ? user.role : "tenant")
    setSelectedUserOrgId(user.organization_id ?? "")
  }

  const handleReassignUser = async () => {
    if (!selectedUserId) return
    await reassignUser.mutateAsync({
      user_id: selectedUserId,
      organization_id: selectedUserOrgId || null,
      role: selectedUserRole,
    })
  }

  const handleToggleUser = async (user: PlatformUserSummary) => {
    await setPlatformUserActiveState.mutateAsync({
      user_id: user.id,
      is_active: !user.is_active,
    })
  }

  const handleDeleteOrganization = async () => {
    if (!organizationDeleteId || !organizationDeleteName.trim()) return
    await deleteOrganization.mutateAsync({
      organization_id: organizationDeleteId,
      confirm_name: organizationDeleteName.trim(),
    })
    setOrganizationDeleteId("")
    setOrganizationDeleteName("")
  }

  const handleArchiveOrganization = async () => {
    if (!organizationDeleteId || !organizationDeleteName.trim()) return
    await archiveOrganization.mutateAsync({
      organization_id: organizationDeleteId,
      confirm_name: organizationDeleteName.trim(),
    })
    setOrganizationDeleteId("")
    setOrganizationDeleteName("")
  }

  const handleDeleteUser = async () => {
    if (!userDeleteId) return
    await deleteUser.mutateAsync({ user_id: userDeleteId })
    setUserDeleteId("")
  }

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>Organizations</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{organizations.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pending invites</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{pendingInvites.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Platform users</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{users.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Audit events</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{auditLogs.length}</CardContent>
          </Card>
        </div>
      </section>

      <section id="provisioning">
      <Card>
        <CardHeader>
          <CardTitle>Provision organization</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Organization name</Label>
            <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
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
            <Label>Primary landlord name</Label>
            <Input value={landlordName} onChange={(event) => setLandlordName(event.target.value)} />
          </div>
          <div>
            <Label>Primary landlord email</Label>
            <Input type="email" value={landlordEmail} onChange={(event) => setLandlordEmail(event.target.value)} />
          </div>
          <div>
            <Label>Admin name</Label>
            <Input value={adminName} onChange={(event) => setAdminName(event.target.value)} />
          </div>
          <div>
            <Label>Admin email</Label>
            <Input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={() => void handleProvision()}
              disabled={provisionOrganization.isPending || !organizationName.trim() || !landlordName.trim() || !landlordEmail.trim()}
            >
              {provisionOrganization.isPending ? "Provisioning..." : "Create organization and send invites"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </section>

      <section id="invitations">
      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-muted-foreground">
                    {invite.role} {invite.organization_id ? `· Org ${invite.organization_id}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-muted-foreground">
                    <p className="uppercase">{invite.status}</p>
                    <p>Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void resendInvitation.mutateAsync(invite.id)}
                    disabled={resendInvitation.isPending}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void revokeInvitation.mutateAsync(invite.id)}
                    disabled={revokeInvitation.isPending}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!pendingInvites.length && <p className="text-sm text-muted-foreground">No pending invitations.</p>}
        </CardContent>
      </Card>
      </section>

      <section id="organizations">
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.map((organization) => (
            <div key={organization.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{organization.name}</p>
                  <p className="text-muted-foreground">{organization.slug}</p>
                  {!organization.is_active && <p className="text-xs text-amber-600">Archived</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-muted-foreground">
                    <p className="capitalize">{organization.subscription_plan}</p>
                    <p>{new Date(organization.created_at).toLocaleDateString()}</p>
                  </div>
                  {!organization.is_active && (
                    <Button
                      variant="outline"
                      onClick={() => void restoreOrganization.mutateAsync({ organization_id: organization.id })}
                      disabled={restoreOrganization.isPending}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!organizations.length && <p className="text-sm text-muted-foreground">No organizations provisioned yet.</p>}
        </CardContent>
      </Card>
      </section>

      <section id="users">
      <Card>
        <CardHeader>
          <CardTitle>Admin management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {adminUsers.map((user) => (
              <div key={user.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.full_name ?? user.email ?? user.id}</p>
                    <p className="text-muted-foreground">{user.email ?? "No email"}</p>
                    <p className="text-muted-foreground">
                      {user.role} {user.organization_name ? `· ${user.organization_name}` : "· Unassigned"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleLoadUser(user)}>
                      Manage
                    </Button>
                    <Button variant="outline" onClick={() => void handleToggleUser(user)} disabled={setPlatformUserActiveState.isPending}>
                      {user.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!adminUsers.length && <p className="text-sm text-muted-foreground">No admins, landlords, or agents found.</p>}
          </div>

          <div className="grid gap-4 rounded-md border p-4 md:grid-cols-3">
            <div>
              <Label>User</Label>
              <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                <option value="">Select user</option>
                {manageableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {(user.full_name ?? user.email ?? user.id)} ({user.role})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={selectedUserRole} onChange={(event) => setSelectedUserRole(event.target.value as "landlord" | "admin" | "agent" | "tenant")}>
                <option value="landlord">landlord</option>
                <option value="admin">admin</option>
                <option value="agent">agent</option>
                <option value="tenant">tenant</option>
              </Select>
            </div>
            <div>
              <Label>Organization</Label>
              <Select value={selectedUserOrgId} onChange={(event) => setSelectedUserOrgId(event.target.value)}>
                <option value="">Unassigned</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {selectedUser ? `Selected: ${selectedUser.full_name ?? selectedUser.email ?? selectedUser.id}` : "Choose a user to reassign role or organization."}
              </p>
              <Button onClick={() => void handleReassignUser()} disabled={!selectedUserId || reassignUser.isPending}>
                {reassignUser.isPending ? "Saving..." : "Save assignment"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Destructive actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border p-4">
            <p className="font-medium">Delete organization</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Archive first when possible. Permanent deletion remains available for irrecoverable cleanup and will cascade through organization data.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Organization</Label>
                <Select value={organizationDeleteId} onChange={(event) => setOrganizationDeleteId(event.target.value)}>
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Type organization name to confirm</Label>
                <Input value={organizationDeleteName} onChange={(event) => setOrganizationDeleteName(event.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => void handleArchiveOrganization()} disabled={!organizationDeleteId || !organizationDeleteName.trim() || archiveOrganization.isPending}>
                  {archiveOrganization.isPending ? "Archiving..." : "Archive organization"}
                </Button>
                <Button onClick={() => void handleDeleteOrganization()} disabled={!organizationDeleteId || !organizationDeleteName.trim() || deleteOrganization.isPending}>
                {deleteOrganization.isPending ? "Deleting..." : "Delete organization"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4">
            <p className="font-medium">Delete user</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently removes the auth account and the corresponding profile record. Do not use this for routine access control; prefer disable when possible.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>User</Label>
                <Select value={userDeleteId} onChange={(event) => setUserDeleteId(event.target.value)}>
                  <option value="">Select user</option>
                  {manageableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {(user.full_name ?? user.email ?? user.id)} ({user.role})
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={() => void handleDeleteUser()} disabled={!userDeleteId || deleteUser.isPending}>
                {deleteUser.isPending ? "Deleting..." : "Delete user"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section id="audit">
        <Card>
          <CardHeader>
            <CardTitle>Audit logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-muted-foreground">
                      {log.actor_name ?? log.actor_id ?? "Unknown actor"} · {log.target_type}
                      {log.target_id ? ` · ${log.target_id}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {!auditLogs.length && <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
