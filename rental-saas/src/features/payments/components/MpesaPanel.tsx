import { useMemo, useState } from "react"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { useAuth } from "../../../app/providers"
import { useMpesaQueryTransactions, useMpesaRegisterPull } from "../../../lib/mpesa"

function toDateTimeString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function MpesaPanel() {
  const { profile, organization } = useAuth()
  const registerPull = useMpesaRegisterPull()
  const queryTransactions = useMpesaQueryTransactions()

  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    now.setHours(now.getHours() - 24)
    return now.toISOString().slice(0, 16)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 16))

  const rangeHours = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
  }, [endDate, startDate])

  const syncResult = queryTransactions.data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          M-Pesa Pull API
          <Badge>{organization?.mpesa_env === "production" ? "PRODUCTION" : "SANDBOX"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium">Registration</h4>
            <Badge>{organization?.mpesa_pull_registered ? "Registered ✓" : "Not registered ⚠"}</Badge>
          </div>
          <Button
            variant="outline"
            disabled={registerPull.isPending || !profile?.organization_id}
            onClick={() => void registerPull.mutateAsync({ organization_id: profile?.organization_id as string })}
          >
            {registerPull.isPending ? "Registering..." : "Register Pull API"}
          </Button>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <h4 className="font-medium">Reconciliation</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Start</label>
              <Input type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="text-sm">End</label>
              <Input type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          {rangeHours > 48 && <p className="text-sm text-amber-600">Warning: recommended sync range is 48 hours or less.</p>}

          <Button
            disabled={queryTransactions.isPending || !profile?.organization_id}
            onClick={() =>
              void queryTransactions.mutateAsync({
                organization_id: profile?.organization_id as string,
                start_date: toDateTimeString(new Date(startDate)),
                end_date: toDateTimeString(new Date(endDate)),
              })
            }
          >
            {queryTransactions.isPending ? "Syncing..." : "Sync Transactions"}
          </Button>

          {syncResult && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p>Total fetched: {syncResult.totalFetched ?? 0}</p>
              <p>New payments: {syncResult.newPayments ?? 0}</p>
              <p>Invoices updated: {syncResult.invoicesUpdated ?? 0}</p>
              <p>Duplicates skipped: {syncResult.duplicatesSkipped ?? 0}</p>
              <p>Last synced: {syncResult.lastSyncedAt ?? "-"}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
