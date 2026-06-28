import { useEffect, useMemo, useState } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useToast } from "../../../components/ui/toast"
import { useAuth } from "../../../app/providers"
import { useQueryClient } from "@tanstack/react-query"
import { useTenants } from "../../tenants/hooks/useTenants"
import { DEFAULT_SMS_TEMPLATES, type SmsMessageType } from "../types/sms.types"
import { useSmsTemplates } from "../hooks/useSms"
import * as smsService from "../services/smsService"

const messageTypes: SmsMessageType[] = [
  "welcome",
  "rent_reminder",
  "overdue_notice",
  "payment_confirmed",
  "invoice_generated",
  "maintenance_update",
  "lease_expiry",
  "paybill_info",
  "custom",
]

function extractVariables(template: string) {
  const matches = template.match(/\{\{(\w+)\}\}/g) ?? []
  return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))))
}

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}

function smsCount(chars: number) {
  if (chars <= 160) return 1
  if (chars <= 306) return 2
  return Math.ceil(chars / 153)
}

export function BulkSmsDialog({
  preSelectedTenantIds,
  defaultMessageType = "rent_reminder",
  open,
  onOpenChange,
}: {
  preSelectedTenantIds?: string[]
  defaultMessageType?: SmsMessageType
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: tenants = [] } = useTenants()
  const { data: templates = [] } = useSmsTemplates()

  const [step, setStep] = useState(1)
  const [filter, setFilter] = useState<"all" | "arrears" | "property">("all")
  const [propertyFilter, setPropertyFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelectedTenantIds ?? [])
  const [messageType, setMessageType] = useState<SmsMessageType>(defaultMessageType)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [customMessage, setCustomMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)

  const properties = useMemo(() => {
    const list = tenants.map((t) => t.activeLease?.property_name).filter(Boolean) as string[]
    return Array.from(new Set(list))
  }, [tenants])

  const filteredTenants = useMemo(() => {
    if (filter === "arrears") return tenants.filter((t) => t.outstanding_balance > 0)
    if (filter === "property" && propertyFilter) {
      return tenants.filter((t) => t.activeLease?.property_name === propertyFilter)
    }
    return tenants
  }, [tenants, filter, propertyFilter])

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredTenants.map((t) => t.id))
    else setSelectedIds([])
  }

  const templateBody = useMemo(() => {
    const override = templates.find((t) => t.message_type === messageType)?.template_body
    return override ?? DEFAULT_SMS_TEMPLATES[messageType]
  }, [messageType, templates])

  const variableKeys = useMemo(() => extractVariables(templateBody), [templateBody])
  const preview = useMemo(() => interpolate(templateBody, variables), [templateBody, variables])
  const messageToSend = messageType === "custom" ? customMessage : preview

  const estimatedSms = smsCount(messageToSend.length)
  const estimatedCost = (estimatedSms * 0.25 * selectedIds.length).toFixed(2)

  const reset = () => {
    setStep(1)
    setFilter("all")
    setPropertyFilter("")
    setSelectedIds(preSelectedTenantIds ?? [])
    setMessageType(defaultMessageType)
    setVariables({})
    setCustomMessage("")
    setSending(false)
    setProgress(0)
  }

  useEffect(() => {
    if (open) {
      setSelectedIds(preSelectedTenantIds ?? [])
      setMessageType(defaultMessageType)
    }
  }, [open, preSelectedTenantIds, defaultMessageType])

  const sendBulk = async () => {
    if (!profile?.organization_id) return
    setSending(true)
    setProgress(0)

    let sent = 0
    let failed = 0

    for (let i = 0; i < selectedIds.length; i += 1) {
      const tenantId = selectedIds[i]
      try {
        const res = await smsService.sendSms(profile.organization_id, {
          tenant_id: tenantId,
          message_type: messageType,
          message_body: messageType === "custom" ? customMessage : undefined,
          template_variables: messageType === "custom" ? undefined : variables,
        })
        if (res.success) sent += 1
        else failed += 1
      } catch {
        failed += 1
      }
      setProgress(Math.round(((i + 1) / selectedIds.length) * 100))
    }

    qc.invalidateQueries({ queryKey: ["sms_logs", profile.organization_id] })
    qc.invalidateQueries({ queryKey: ["sms_stats", profile.organization_id] })

    toast({ title: "Bulk SMS Complete", description: `${sent} sent successfully, ${failed} failed` })
    setSending(false)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value) }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk SMS</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All Tenants</Button>
              <Button variant={filter === "arrears" ? "default" : "outline"} onClick={() => setFilter("arrears")}>Tenants with Arrears</Button>
              <Button variant={filter === "property" ? "default" : "outline"} onClick={() => setFilter("property")}>Specific Property</Button>
              {filter === "property" && (
                <Select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property} value={property}>{property}</option>
                  ))}
                </Select>
              )}
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={selectedIds.length === filteredTenants.length && filteredTenants.length > 0} onChange={(e) => toggleAll(e.target.checked)} />
              Select all
            </label>

            <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-3">
              {filteredTenants.map((tenant) => (
                <label key={tenant.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{tenant.full_name ?? "Tenant"}</p>
                    <p className="text-xs text-muted-foreground">{tenant.activeLease?.unit_number ?? "-"} {tenant.activeLease?.property_name ? `- ${tenant.activeLease?.property_name}` : ""}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tenant.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((prev) => [...prev, tenant.id])
                      else setSelectedIds((prev) => prev.filter((id) => id !== tenant.id))
                    }}
                  />
                </label>
              ))}
              {!filteredTenants.length && <p className="text-xs text-muted-foreground">No tenants found.</p>}
            </div>

            <p className="text-xs text-muted-foreground">{selectedIds.length} tenants selected</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-sm">
            <div>
              <Label>Message type</Label>
              <Select value={messageType} onChange={(event) => setMessageType(event.target.value as SmsMessageType)}>
                {messageTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </div>

            {messageType !== "custom" && (
              <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                <div>
                  <Label>Template preview</Label>
                  <div className="min-h-28 rounded-md border bg-muted/20 p-3 text-xs leading-relaxed">
                    {preview || "No template defined."}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {messageToSend.length} chars - {smsCount(messageToSend.length)} SMS
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Variables</Label>
                  {variableKeys.length === 0 && <p className="text-xs text-muted-foreground">No variables.</p>}
                  {variableKeys.map((key) => (
                    <div key={key}>
                      <Input
                        placeholder={key}
                        value={variables[key] ?? ""}
                        onChange={(event) => setVariables((prev) => ({ ...prev, [key]: event.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messageType === "custom" && (
              <div>
                <Label>Custom message</Label>
                <textarea
                  className="min-h-28 w-full rounded-md border p-2 text-sm"
                  value={customMessage}
                  onChange={(event) => setCustomMessage(event.target.value)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {messageToSend.length} chars - {smsCount(messageToSend.length)} SMS
                </p>
              </div>
            )}

            <div className="rounded-md border bg-muted/20 p-3 text-xs">
              Estimated cost: {selectedIds.length} tenants x {smsCount(messageToSend.length)} SMS x KES 0.25 = KES {estimatedCost}
            </div>
            {selectedIds.length > 50 && (
              <p className="text-xs text-amber-600">Large sends may take a few minutes.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm">
            <p>Sending to {selectedIds.length} tenants via configured shortcode.</p>
            <div className="max-h-52 space-y-1 overflow-auto rounded-md border p-3">
              {tenants.filter((t) => selectedIds.includes(t.id)).map((tenant) => (
                <p key={tenant.id}>{tenant.full_name ?? "Tenant"} - {tenant.phone ?? "No phone"}</p>
              ))}
            </div>
            {sending && (
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-muted">
                  <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex w-full justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || sending}>Back</Button>
          {step < 3 && (
            <Button onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={selectedIds.length === 0}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button onClick={() => void sendBulk()} disabled={sending || selectedIds.length === 0}>
              {sending ? "Sending..." : "Send SMS"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
