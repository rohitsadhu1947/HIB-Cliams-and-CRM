"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ClaimsStatusChartProps {
  pending: number
  approved: number
  rejected: number
}

export function ClaimsStatusChart({ pending, approved, rejected }: ClaimsStatusChartProps) {
  const data = [
    { name: "Pending", value: pending, color: "hsl(var(--chart-1))" },
    { name: "Approved", value: approved, color: "hsl(var(--chart-2))" },
    { name: "Rejected", value: rejected, color: "hsl(var(--chart-3))" },
  ]

  return (
    <ChartContainer
      config={{
        pending: {
          label: "Pending",
          color: "hsl(var(--chart-1))",
        },
        approved: {
          label: "Approved",
          color: "hsl(var(--chart-2))",
        },
        rejected: {
          label: "Rejected",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
