import { Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatKES } from "../../../lib/utils/format"

export function RevenueExpensesChart({ data }: { data: Array<{ month: string; revenue: number; expenses: number; profit: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => formatKES(v)} />
          <Tooltip formatter={(value: number) => formatKES(value)} />
          <Legend verticalAlign="bottom" />
          <Bar dataKey="revenue" fill="#2563eb" />
          <Bar dataKey="expenses" fill="#ef4444" />
          <Line dataKey="profit" stroke="#16a34a" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
