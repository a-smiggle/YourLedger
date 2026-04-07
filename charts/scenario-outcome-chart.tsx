"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ScenarioProjectionPoint } from "@/types/domain";

function getXAxisInterval(dataLength: number) {
  if (dataLength <= 24) {
    return 2;
  }

  return Math.max(Math.floor(dataLength / 8), 1);
}

export function ScenarioOutcomeChart({ points }: Readonly<{ points: ScenarioProjectionPoint[] }>) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="monthLabel" stroke="#57657a" tickLine={false} axisLine={false} interval={getXAxisInterval(points.length)} />
          <YAxis
            yAxisId="wealth"
            stroke="#57657a"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="savings"
            orientation="right"
            stroke="#9c5d12"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labelMap: Record<string, string> = {
                totalWealth: "Total wealth",
                totalDebtBalance: "Total debt",
                offsetBalance: "Offset balance",
                cumulativeInterestSaved: "Interest saved",
              };

              return [`$${value.toLocaleString()}`, labelMap[name] ?? name];
            }}
          />
          <Legend
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