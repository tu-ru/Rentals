import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatKES } from "../../../lib/utils/format"

export function PropertyBreakdownChart({ data }: { data: Array<{ propertyName: string; units: number; occupied: number; revenue: number }> }) {
  const transformed = data.map((item) => ({
    ...item,
    vacant: Math.max(item.units - item.occupied, 0),
  }))
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={transformed}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="propertyName" />
          <YAxis yAxisId="units" />
          <YAxis yAxisId="revenue" orientation="right" tickFormatter={(v) => formatKES(v)} />
          <Tooltip
            formatter={(value: number, name) => {
              if (name === "revenue") return [formatKES(value), "Revenue"]
              if (name === "occupied") return [value, "Occupied"]
              if (name === "vacant") return [value, "Vacant"]
              return [value, name]
            }}
          />
          <Legend verticalAlign="bottom" />
          <Bar yAxisId="units" dataKey="occupied" stackId="units" fill="#2563eb" />
          <Bar yAxisId="units" dataKey="vacant" stackId="units" fill="#cbd5e1" />
          <Line yAxisId="revenue" dataKey="revenue" stroke="#16a34a" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
