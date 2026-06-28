import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { DEFAULT_SMS_TEMPLATES, type SmsMessageType, type SmsTemplate } from "../types/sms.types"

const VARIABLE_HELP: Array<{ key: string; label: string }> = [
  { key: "tenant_name", label: "Tenant's full name" },
  { key: "amount", label: "Payment amount (KES)" },
  { key: "due_date", label: "Invoice due date" },
  { key: "property_name", label: "Property name" },
  { key: "unit_number", label: "Unit number (e.g. A1)" },
  { key: "paybill", label: "M-Pesa Paybill number" },
  { key: "account_number", label: "M-Pesa account/bill reference" },
  { key: "balance", label: "Outstanding balance" },
  { key: "org_name", label: "Organization name" },
  { key: "lease_end_date", label: "Lease expiry date" },
  { key: "invoice_number", label: "Invoice reference number" },
  { key: "transaction_id", label: "M-Pesa transaction ID" },
]

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}

function smsCount(chars: number) {
  if (chars <= 160) return 1
  if (chars <= 306) return 2
  return Math.ceil(chars / 153)
}

const sampleData: Record<string, string> = {
  tenant_name: "Jane Mwangi",
  amount: "KES 25,000",
  due_date: "2026-04-05",
  property_name: "Kilimani Heights",
  unit_number: "A2",
  paybill: "174379",
  account_number: "INV-202604-1234",
  balance: "KES 10,500",
  org_name: "K535",
  lease_end_date: "2026-12-31",
  invoice_number: "INV-202604-1234",
  transaction_id: "QK123ABC9D",
}

export function SmsTemplateEditor({
  messageType,
  currentTemplate,
  onSave,
}: {
  messageType: SmsMessageType
  currentTemplate?: SmsTemplate
  onSave: (data: { messageType: SmsMessageType; body: string; name: string }) => void
}) {
  const [name, setName] = useState(currentTemplate?.template_name ?? `${messageType} template`)
  const [body, setBody] = useState(currentTemplate?.template_body ?? DEFAULT_SMS_TEMPLATES[messageType])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const preview = useMemo(() => interpolate(body, sampleData), [body])
  const charCount = body.length

  useEffect(() => {
    setName(currentTemplate?.template_name ?? `${messageType} template`)
    setBody(currentTemplate?.template_body ?? DEFAULT_SMS_TEMPLATES[messageType])
  }, [currentTemplate, messageType])

  const insertVariable = (key: string) => {
    const variable = `{{${key}}}`
    const textarea = textareaRef.current
    if (!textarea) {
      setBody((prev) => prev + variable)
      return
    }
    const start = textarea.selectionStart ?? body.length
    const end = textarea.selectionEnd ?? body.length
    const next = body.slice(0, start) + variable + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    })
  }

  return (
    <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <div>
          <Label>Template name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Template body</Label>
          <textarea
            ref={textareaRef}
            className="min-h-32 w-full rounded-md border p-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setBody(DEFAULT_SMS_TEMPLATES[messageType])}>Reset to default</Button>
          <Button size="sm" onClick={() => onSave({ messageType, body, name })}>Save</Button>
        </div>
        <p className="text-xs text-muted-foreground">{charCount} chars - {smsCount(charCount)} SMS</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-md border bg-muted/20 p-3 text-xs">
          <p className="mb-2 font-semibold">Variables</p>
          <div className="space-y-2">
            {VARIABLE_HELP.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => insertVariable(item.key)}
                className="block w-full rounded-md border px-2 py-1 text-left text-xs hover:bg-muted"
              >
                <strong>{`{{${item.key}}}`}</strong> - {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-muted/20 p-3 text-xs">
          <p className="mb-2 font-semibold">Live preview</p>
          <p className="whitespace-pre-wrap">{preview}</p>
        </div>
      </div>
    </div>
  )
}
