"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getTimeSeriesXAxisInterval } from "@/charts/chart-presentation";
import { useCompactLayout } from "@/hooks/use-compact-layout";
import type { ScenarioProjectionPoint } from "@/types/domain";

export function ScenarioOutcomeChart({ points }: Readonly<{ points: ScenarioProjectionPoint[] }>) {
  const isCompact = useCompactLayout();

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="monthLabel" stroke="#57657a" tickLine={false} axisLine={false} interval={getTimeSeriesXAxisInterval(points.length, isCompact)} tick={{ fontSize: isCompact ? 11 : 12 }} tickMargin={8} minTickGap={isCompact ? 20 : 12} />
          <YAxis
            yAxisId="wealth"
            stroke="#57657a"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isCompact ? 11 : 12 }}
            width={isCompact ? 42 : 60}
          />
          <YAxis
            yAxisId="savings"
            orientation="right"
            stroke="#9c5d12"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isCompact ? 11 : 12 }}
            width={isCompact ? 42 : 60}
          />
          <Tooltip
            formatter={(value, name) => {
              const labelMap: Record<string, string> = {
                totalWealth: "Total wealth",
                totalDebtBalance: "Total debt",
                offsetBalance: "Offset balance",
                cumulativeInterestSaved: "Interest saved",
              };

              if (typeof value !== "number") {
                return [Array.isArray(value) ? value.join(", ") : value ?? "Not set", labelMap[name] ?? name];
              }

              return [`$${value.toLocaleString()}`, labelMap[name] ?? name];
            }}
          />
          <Legend
            iconSize={isCompact ? 10 : 14}
            wrapperStyle={{ fontSize: isCompact ? 11 : 12, paddingTop: 8 }}
            formatter={(value) => {
              const labelMap: Record<string, string> = {
                totalWealth: "Total wealth",
                totalDebtBalance: "Total debt",
                offsetBalance: "Offset balance",
                cumulativeInterestSaved: "Interest saved",
              };

              return labelMap[value] ?? value;
            }}
          />
          <Line yAxisId="wealth" type="monotone" dataKey="totalWealth" stroke="#012169" strokeWidth={3} dot={false} name="totalWealth" />
          <Line yAxisId="wealth" type="monotone" dataKey="totalDebtBalance" stroke="#b44f2b" strokeWidth={2} dot={false} name="totalDebtBalance" />
          <Line yAxisId="wealth" type="monotone" dataKey="offsetBalance" stroke="#2a7f62" strokeWidth={2} dot={false} name="offsetBalance" />
          <Line yAxisId="savings" type="monotone" dataKey="cumulativeInterestSaved" stroke="#c27b2f" strokeWidth={2} dot={false} name="cumulativeInterestSaved" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}