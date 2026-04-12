"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getCategoryXAxisInterval, truncateChartLabel } from "@/charts/chart-presentation";
import { useCompactLayout } from "@/hooks/use-compact-layout";
import type { ScenarioSummary } from "@/types/domain";

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export function DealFitChart({ scenarios }: Readonly<{ scenarios: ScenarioSummary[] }>) {
  const isCompact = useCompactLayout();
  const data = scenarios.map((scenario) => ({
    name: scenario.label,
    borrowingPower: scenario.borrowingPower,
    totalDebt: scenario.requiredLoanAmount ?? null,
  }));

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={10}>
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
          <Tooltip
            formatter={(value: number | null, name: string) => {
              if (value === null) {
                return ["Not set", name === "totalDebt" ? "Total debt" : "Borrowing power"];
              }

              return [formatCurrency(value), name === "totalDebt" ? "Total debt" : "Borrowing power"];
            }}
          />
          <Legend formatter={(value) => (value === "totalDebt" ? "Total debt" : "Borrowing power")} iconSize={isCompact ? 10 : 14} wrapperStyle={{ fontSize: isCompact ? 11 : 12, paddingTop: 8 }} />
          <Bar dataKey="borrowingPower" name="borrowingPower" fill="#012169" radius={[10, 10, 0, 0]} />
          <Bar dataKey="totalDebt" name="totalDebt" fill="#d08a18" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}