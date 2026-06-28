import { Building2, MessageSquare, UserRound, Wrench } from "lucide-react"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { ChatWindow, ConversationList } from "../../messaging/components"
import { MaintenanceStatusForm } from "../../maintenance/components/MaintenanceStatusForm"
import { useStartTenantConversation, useAgentWorkspace } from "../hooks"
import type { AgentMaintenanceItem } from "../types"

export function AgentWorkspace() {
  const { data, isLoading } = useAgentWorkspace()
  const startConversation = useStartTenantConversation()
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined)
  const [selectedMaintenance, setSelectedMaintenance] = useState<AgentMaintenanceItem | null>(null)

  const unreadByConversation = useMemo(() => ({}), [])

  if (isLoading) {
    return <div className="space-y-4"><p className="text-sm text-muted-foreground">Loading agent workspace...</p></div>
  }

  const properties = data?.properties ?? []
  const tenants = data?.tenants ?? []
  const maintenance = data?.maintenance ?? []
  const conversations = data?.conversations ?? []

  return (
    <>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Building2 className="h-5 w-5 text-primary" />
              <div><p className="text-sm text-muted-foreground">Assigned properties</p><p className="text-2xl font-semibold">{properties.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <UserRound className="h-5 w-5 text-primary" />
              <div><p className="text-sm text-muted-foreground">Active tenants</p><p className="text-2xl font-semibold">{tenants.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Wrench className="h-5 w-5 text-primary" />
              <div><p className="text-sm text-muted-foreground">Open maintenance</p><p className="text-2xl font-semibold">{maintenance.filter((item) => item.status !== "resolved" && item.status !== "closed").length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div><p className="text-sm text-muted-foreground">Conversations</p><p className="text-2xl font-semibold">{conversations.length}</p></div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Assigned properties</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {properties.map((property) => (
                <div key={property.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                    </div>
                    <Badge variant={property.is_active ? "default" : "outline"}>{property.property_type}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Units: {property.total_units} · Occupied: {property.occupied_units}</p>
                </div>
              ))}
              {!properties.length && <p className="text-sm text-muted-foreground">No property assignments yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Assigned tenant directory</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tenants.map((tenant) => (
                <div key={tenant.lease_id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{tenant.full_name ?? "Unnamed tenant"}</p>
                    <p className="text-sm text-muted-foreground">{tenant.property_name} · {tenant.unit_number}</p>
                    <p className="text-xs text-muted-foreground">{tenant.phone ?? "No phone"}</p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={startConversation.isPending}
                    onClick={async () => {
                      const conversation = await startConversation.mutateAsync({ tenantId: tenant.tenant_id, propertyId: tenant.property_id })
                      setSelectedConversationId(conversation.id)
                    }}
                  >
                    Message
                  </Button>
                </div>
              ))}
              {!tenants.length && <p className="text-sm text-muted-foreground">No assigned tenants found.</p>}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Maintenance queue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {maintenance.map((request) => (
                <div key={request.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">{request.property_name ?? "Property"} · {request.unit_number ?? "Unit"} · {request.tenant_name ?? "Tenant"}</p>
                    </div>
                    <Badge>{request.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{request.description}</p>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => setSelectedMaintenance(request)}>Update status</Button>
                  </div>
                </div>
              ))}
              {!maintenance.length && <p className="text-sm text-muted-foreground">No maintenance requests in your scope.</p>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Tenant conversations</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="h-[32rem] overflow-hidden rounded-b-lg border-t bg-background md:grid md:grid-cols-2">
                <ConversationList
                  conversations={conversations.map((conversation) => ({
                    ...conversation,
                    title: conversation.title || conversation.participant_names.filter((name) => name).join(", "),
                  }))}
                  selectedId={selectedConversationId}
                  unreadByConversation={unreadByConversation}
                  onSelect={setSelectedConversationId}
                />
                <ChatWindow conversationId={selectedConversationId} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <MaintenanceStatusForm
        open={Boolean(selectedMaintenance)}
        onOpenChange={(open) => !open && setSelectedMaintenance(null)}
        request={selectedMaintenance}
      />
    </>
  )
}
