"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getCategoryXAxisInterval, truncateChartLabel } from "@/charts/chart-presentation";
import { useCompactLayout } from "@/hooks/use-compact-layout";
import type { ScenarioSummary } from "@/types/domain";

export function BorrowingPowerChart({ scenarios }: Readonly<{ scenarios: ScenarioSummary[] }>) {
  const isCompact = useCompactLayout();
  const data = scenarios.map((scenario) => ({
    name: scenario.label,
    borrowingPower: scenario.borrowingPower,
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#57657a"
            tickLine={false}
            axisLine={false}
            interval={getCategoryXAxisInterval(data.length, isCompact)}
            tick={{ fontSize: isCompact ? 11 : 12 }}
            tickMargin={8}
            tickFormatter={(value: string) => (isCompact ? truncateChartLabel(value, 12) : value)}
          />
          <YAxis
            stroke="#57657a"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isCompact ? 11 : 12 }}
            width={isCompact ? 42 : 60}
          />
          <Tooltip formatter={(value) => [typeof value === "number" ? `$${value.toLocaleString()}` : String(value), "Borrowing power"]} />
          <Bar dataKey="borrowingPower" fill="#012169" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}