"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ScenarioSummary } from "@/types/domain";

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export function DealFitChart({ scenarios }: Readonly<{ scenarios: ScenarioSummary[] }>) {
  const data = scenarios.map((scenario) => ({
    name: scenario.label,
    borrowingPower: scenario.borrowingPower,
    totalDebt: scenario.requiredLoanAmount ?? null,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={10}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" stroke="#57657a" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#57657a"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number | null, name: string) => {
              if (value === null) {
                return ["Not set", name === "totalDebt" ? "Total debt" : "Borrowing power"];
              }

              return [formatCurrency(value), name === "totalDebt" ? "Total debt" : "Borrowing power"];
            }}
          />
          <Legend formatter={(value) => (value === "totalDebt" ? "Total debt" : "Borrowing power")} />
          <Bar dataKey="borrowingPower" name="borrowingPower" fill="#012169" radius={[10, 10, 0, 0]} />
          <Bar dataKey="totalDebt" name="totalDebt" fill="#d08a18" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}