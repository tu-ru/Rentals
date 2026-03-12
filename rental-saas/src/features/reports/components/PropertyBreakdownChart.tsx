import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function PropertyBreakdownChart({ data }: { data: Array<{ propertyName: string; units: number; occupied: number; revenue: number }> }) {
  const transformed = data.map((item) => ({ ...item, vacant: Math.max(item.units - item.occupied, 0) }))
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={transformed} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="propertyName" type="category" width={120} />
          <Tooltip />
          <Bar dataKey="occupied" stackId="units" fill="#2563eb" />
          <Bar dataKey="vacant" stackId="units" fill="#cbd5e1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
