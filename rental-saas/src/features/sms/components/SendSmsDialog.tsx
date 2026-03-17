import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useSmsTemplates, useSendSms } from "../hooks/useSms"
import { DEFAULT_SMS_TEMPLATES, type SmsMessageType } from "../types/sms.types"

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

export function SendSmsDialog({
  tenantId,
  tenantName,
  tenantPhone,
  defaultMessageType = "paybill_info",
  defaultVariables,
  relatedInvoiceId,
  relatedPaymentId,
  relatedMaintenanceId,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  tenantId: string
  tenantName?: string
  tenantPhone?: string | null
  defaultMessageType?: SmsMessageType
  defaultVariables?: Record<string, string>
  relatedInvoiceId?: string
  relatedPaymentId?: string
  relatedMaintenanceId?: string
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [openState, setOpenState] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : openState
  const onOpenChange = onOpenChangeProp ?? setOpenState

  const [messageType, setMessageType] = useState<SmsMessageType>(defaultMessageType)
  const [customMessage, setCustomMessage] = useState("")
  const [variables, setVariables] = useState<Record<string, string>>(defaultVariables ?? {})
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleTime, setScheduleTime] = useState("")

  const { data: templates = [] } = useSmsTemplates()
  const sendSms = useSendSms()

  const templateBody = useMemo(() => {
    const override = templates.find((t) => t.message_type === messageType)?.template_body
    return override ?? DEFAULT_SMS_TEMPLATES[messageType]
  }, [messageType, templates])

  const variableKeys = useMemo(() => extractVariables(templateBody), [templateBody])
  const preview = useMemo(() => interpolate(templateBody, variables), [templateBody, variables])
  const messageToSend = messageType === "custom" ? customMessage : preview

  useEffect(() => {
    setVariables(defaultVariables ?? {})
  }, [defaultVariables, messageType])

  const submit = async () => {
    await sendSms.mutateAsync({
      tenant_id: tenantId,
      message_type: messageType,
      message_body: messageType === "custom" ? customMessage : undefined,
      template_variables: messageType === "custom" ? undefined : variables,
      related_invoice_id: relatedInvoiceId,
      related_payment_id: relatedPaymentId,
      related_maintenance_id: relatedMaintenanceId,
      scheduled_for: scheduleEnabled && scheduleTime ? scheduleTime.replace("T", " ") : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send SMS</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <Label>Recipient</Label>
            <Input value={`${tenantName ?? "Tenant"} (${tenantPhone ?? "No phone"})`} readOnly />
          </div>

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

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={scheduleEnabled} onChange={(event) => setScheduleEnabled(event.target.checked)} />
            Schedule SMS
          </label>
          {scheduleEnabled && (
            <Input
              type="datetime-local"
              value={scheduleTime}
              onChange={(event) => setScheduleTime(event.target.value)}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={sendSms.isPending || !messageToSend.trim()}>
            {sendSms.isPending ? "Sending..." : "Send SMS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

