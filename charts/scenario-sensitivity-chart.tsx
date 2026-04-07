"use client";

import { Bar, ComposedChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ScenarioSensitivityPoint } from "@/types/domain";

export function ScenarioSensitivityChart({ points }: Readonly<{ points: ScenarioSensitivityPoint[] }>) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="scenarioRateLabel" stroke="#57657a" tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="repayment"
            stroke="#57657a"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="wealth"
            orientation="right"
            stroke="#012169"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labelMap: Record<string, string> = {
                monthlyScenarioRepayment: "Monthly repayment",
                projectedInterestPaid: "Interest paid",
                projectedWealth: "Projected wealth",
              };

              return [`$${value.toLocaleString()}`, labelMap[name] ?? name];
            }}
          />
          <Legend
            formatter={(value) => {
              const labelMap: Record<string, string> = {
                monthlyScenarioRepayment: "Monthly repayment",
                projectedInterestPaid: "Interest paid",
                projectedWealth: "Projected wealth",
              };

              return labelMap[value] ?? value;
            }}
          />
          <Bar yAxisId="repayment" dataKey="monthlyScenarioRepayment" fill="#2a7f62" name="monthlyScenarioRepayment" radius={[10, 10, 0, 0]} />
          <Line yAxisId="wealth" type="monotone" dataKey="projectedInterestPaid" stroke="#c27b2f" strokeWidth={2} dot={false} name="projectedInterestPaid" />
          <Line yAxisId="wealth" type="monotone" dataKey="projectedWealth" stroke="#012169" strokeWidth={3} dot={false} name="projectedWealth" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}