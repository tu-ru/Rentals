import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon: LucideIcon
  trend?: number
  trendLabel?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const duration = 800
    const start = performance.now()

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1)
      setDisplayValue(Math.round(value * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  const TrendIcon = useMemo(() => (trend && trend > 0 ? ArrowUpRight : ArrowDownRight), [trend])
  const trendColor = trend && trend > 0 ? "text-emerald-600" : "text-red-500"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <motion.p className="text-3xl font-bold tabular-nums" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {displayValue.toLocaleString("en-KE")}
        </motion.p>
        {(subtitle || trend !== undefined) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {trend !== undefined && (
              <span className={`inline-flex items-center ${trendColor}`}>
                <TrendIcon className="mr-1 h-3.5 w-3.5" />
                {Math.abs(trend)}%
              </span>
            )}
            {(trendLabel || subtitle) && <span>{trendLabel ?? subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
