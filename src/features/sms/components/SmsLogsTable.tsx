import { useMemo, useState } from "react"
import { RefreshCcw, Eye, Copy } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select } from "../../../components/ui/select"
import { Badge } from "../../../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { DataTable } from "../../../components/shared/DataTable"
import { useSmsLogs } from "../hooks/useSms"
import * as smsService from "../services/smsService"
import type { SmsLog, SmsStatus } from "../types/sms.types"

const statusTone: Record<SmsStatus, string> = {
  queued: "bg-slate-200 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  scheduled: "bg-amber-100 text-amber-700",
}

const messageTypes = [
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

function truncate(text: string, max = 60) {
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

export function SmsLogsTable() {
  const [status, setStatus] = useState("all")
  const [messageType, setMessageType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [mode, setMode] = useState<"all" | "automated" | "manual">("all")
  const [search, setSearch] = useState("")
  const [openLog, setOpenLog] = useState<SmsLog | null>(null)

  const { data: logs = [], isLoading } = useSmsLogs({
    status: status === "all" ? undefined : status,
    messageType: messageType === "all" ? undefined : messageType,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (mode === "automated" && !log.is_automated) return false
      if (mode === "manual" && log.is_automated) return false
      if (search) {
        const haystack = `${log.tenant?.full_name ?? ""} ${log.tenant?.phone ?? ""} ${log.recipient_phone}`.toLowerCase()
        if (!haystack.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [logs, mode, search])

  const stats = useMemo(() => {
    const total = filtered.length
    const delivered = filtered.filter((l) => l.status === "delivered").length
    const failed = filtered.filter((l) => l.status === "failed").length
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0
    return { total, delivered, failed, rate }
  }, [filtered])

  const columns = useMemo(() => [
    { accessorKey: "created_at", header: "Date/Time", cell: ({ row }: any) => new Date(row.original.created_at).toLocaleString() },
    { accessorKey: "tenant", header: "Tenant", cell: ({ row }: any) => row.original.tenant?.full_name ?? "-" },
    { accessorKey: "recipient_phone", header: "Phone" },
    { accessorKey: "message_type", header: "Type" },
    {
      accessorKey: "message_body",
      header: "Preview",
      cell: ({ row }: any) => (
        <span title={row.original.message_body}>{truncate(row.original.message_body)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge className={statusTone[row.original.status as SmsStatus]}>{row.original.status}</Badge>
      ),
    },
    { accessorKey: "celcom_message_id", header: "Celcom ID", cell: ({ row }: any) => row.original.celcom_message_id ?? "-" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const log = row.original as SmsLog
        return (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpenLog(log)}><Eye className="h-4 w-4" /></Button>
            {log.status === "sent" && log.celcom_message_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void smsService.checkDeliveryStatus(log.id)}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
            {log.celcom_message_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(String(log.celcom_message_id))}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="scheduled">Scheduled</option>
        </Select>
        <Select value={messageType} onChange={(e) => setMessageType(e.target.value)}>
          <option value="all">All Types</option>
          {messageTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="all">Show all</option>
          <option value="automated">Show automated only</option>
          <option value="manual">Show manual only</option>
        </Select>
        <Input
          className="ml-auto max-w-xs"
          placeholder="Search tenant or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns as any} data={filtered} loading={isLoading} />

      <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
        Total shown: {stats.total} | Delivered: {stats.delivered} ({stats.rate}%) | Failed: {stats.failed}
      </div>

      <Dialog open={Boolean(openLog)} onOpenChange={(value) => !value && setOpenLog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Message</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>Tenant:</strong> {openLog?.tenant?.full_name ?? "-"}</p>
            <p><strong>Phone:</strong> {openLog?.recipient_phone}</p>
            <p><strong>Status:</strong> {openLog?.status}</p>
            <p className="whitespace-pre-wrap rounded-md border bg-muted/20 p-3">{openLog?.message_body}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
