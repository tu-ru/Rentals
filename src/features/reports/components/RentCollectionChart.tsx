import { ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatKES } from "../../../lib/utils/format"

export function RentCollectionChart({ data }: { data: Array<{ month: string; collected: number; expected: number; rate: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" tickFormatter={(v) => formatKES(v)} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(value: number, name) => [name === "rate" ? `${Number(value).toFixed(1)}%` : formatKES(value), name]} />
          <Legend verticalAlign="bottom" />
          <Bar yAxisId="left" dataKey="collected" fill="#2563eb" />
          <Line yAxisId="left" dataKey="expected" stroke="#94a3b8" strokeWidth={2} />
          <Line yAxisId="right" dataKey="rate" stroke="#16a34a" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
