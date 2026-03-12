import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { formatKES } from "../../../lib/utils/format"

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#64748b"]

export function PaymentMethodPieChart({ data }: { data: Array<{ method: string; amount: number; count: number }> }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0)
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="method" outerRadius={90}>
            {data.map((entry, index) => (
              <Cell key={entry.method} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatKES(value)} />
          <Legend
            formatter={(value, entry: any) => {
              const amount = entry.payload.amount ?? 0
              const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : "0.0"
              return `${value} • ${formatKES(amount)} (${pct}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
