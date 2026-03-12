import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function OccupancyChart({ data }: { data: Array<{ month: string; occupancyRate: number; vacant: number; occupied: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(value: number, _name, item: any) => [`${Number(value).toFixed(1)}% occupied (${item.payload.vacant} vacant)`, "Occupancy"]} />
          <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="occupancyRate" stroke="#2563eb" fill="url(#occupancyGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
