import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { useSmsStats } from "../hooks/useSms"

function Count({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-2xl font-semibold"
    >
      {value.toLocaleString("en-KE")}
    </motion.span>
  )
}

export function SmsDashboardCard() {
  const { data } = useSmsStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Sent Today</p>
            <Count value={data?.sentToday ?? 0} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delivery Rate</p>
            <Count value={data?.deliveryRate ?? 0} />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failed</p>
            <Count value={data?.failed ?? 0} />
          </div>
        </div>
        <Link className="text-xs text-primary" to="/dashboard/sms">View SMS Logs</Link>
      </CardContent>
    </Card>
  )
}
