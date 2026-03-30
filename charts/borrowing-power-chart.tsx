"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScenarioSummary } from "@/types/domain";

export function BorrowingPowerChart({ scenarios }: Readonly<{ scenarios: ScenarioSummary[] }>) {
  const data = scenarios.map((scenario) => ({
    name: scenario.label,
    borrowingPower: scenario.borrowingPower,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" stroke="#57657a" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#57657a"
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Borrowing power"]} />
          <Bar dataKey="borrowingPower" fill="#012169" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}