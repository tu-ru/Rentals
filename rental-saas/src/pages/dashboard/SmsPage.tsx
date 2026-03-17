import { useMemo, useState } from "react"
import { MessageSquareText } from "lucide-react"
import { PageHeader, StatCard } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Select } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useTenants } from "../../features/tenants/hooks/useTenants"
import { useSmsStats, useSmsTemplates, useUpsertSmsTemplate } from "../../features/sms/hooks/useSms"
import { BulkSmsDialog } from "../../features/sms/components/BulkSmsDialog"
import { SendSmsDialog } from "../../features/sms/components/SendSmsDialog"
import { SmsLogsTable } from "../../features/sms/components/SmsLogsTable"
import { SmsTemplateEditor } from "../../features/sms/components/SmsTemplateEditor"
import type { SmsMessageType } from "../../features/sms/types/sms.types"

export function SmsPage() {
  const { data: tenants = [] } = useTenants()
  const { data: stats } = useSmsStats()
  const { data: templates = [] } = useSmsTemplates()
  const upsertTemplate = useUpsertSmsTemplate()

  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkTenantIds, setBulkTenantIds] = useState<string[]>([])
  const [bulkType, setBulkType] = useState<SmsMessageType>("rent_reminder")
  const [sendOpen, setSendOpen] = useState(false)

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId)

  const arrearsTenants = useMemo(
    () => tenants.filter((t) => t.outstanding_balance > 0).map((t) => t.id),
    [tenants]
  )

  const newTenants = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return tenants.filter((t) => new Date(t.created_at) >= cutoff).map((t) => t.id)
  }, [tenants])

  const activeTenants = useMemo(
    () => tenants.filter((t) => t.activeLease?.status === "active").map((t) => t.id),
    [tenants]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Notifications"
        subtitle="Manage SMS templates, logs, and bulk sends"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)}>
              <option value="">Select tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.full_name ?? "Tenant"}</option>
              ))}
            </Select>
            <Button onClick={() => setSendOpen(true)} disabled={!selectedTenantId}>Send SMS</Button>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Send</Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Sent" value={stats?.totalSent ?? 0} icon={MessageSquareText} />
        <StatCard title="Delivered" value={stats?.delivered ?? 0} icon={MessageSquareText} />
        <StatCard title="Failed" value={stats?.failed ?? 0} icon={MessageSquareText} />
        <StatCard title="Delivery Rate" value={stats?.deliveryRate ?? 0} icon={MessageSquareText} subtitle="Percent" />
      </section>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Message Log</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="quick">Quick Send</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <SmsLogsTable />
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="grid gap-4">
            {([
              "welcome",
              "rent_reminder",
              "overdue_notice",
              "payment_confirmed",
              "invoice_generated",
              "maintenance_update",
              "lease_expiry",
              "paybill_info",
            ] as SmsMessageType[]).map((type) => (
              <SmsTemplateEditor
                key={type}
                messageType={type}
                currentTemplate={templates.find((t) => t.message_type === type)}
                onSave={(data) => upsertTemplate.mutate(data)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm font-semibold">Remind tenants with arrears</p>
                <p className="text-xs text-muted-foreground">Sends overdue notices to tenants with balances.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkTenantIds(arrearsTenants)
                    setBulkType("overdue_notice")
                    setBulkOpen(true)
                  }}
                >
                  Send reminders
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm font-semibold">Send paybill info to new tenants</p>
                <p className="text-xs text-muted-foreground">Targets tenants added in the last 7 days.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkTenantIds(newTenants)
                    setBulkType("paybill_info")
                    setBulkOpen(true)
                  }}
                >
                  Send paybill info
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm font-semibold">Monthly rent reminders</p>
                <p className="text-xs text-muted-foreground">Send reminders to tenants with active leases.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkTenantIds(activeTenants)
                    setBulkType("rent_reminder")
                    setBulkOpen(true)
                  }}
                >
                  Send reminders
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {selectedTenant && (
        <SendSmsDialog
          tenantId={selectedTenant.id}
          tenantName={selectedTenant.full_name ?? "Tenant"}
          tenantPhone={selectedTenant.phone}
          defaultMessageType="paybill_info"
          open={sendOpen}
          onOpenChange={setSendOpen}
        />
      )}

      <BulkSmsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        preSelectedTenantIds={bulkTenantIds}
        defaultMessageType={bulkType}
      />
    </div>
  )
}
