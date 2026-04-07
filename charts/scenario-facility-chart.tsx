"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ScenarioProjectionPoint } from "@/types/domain";

function getXAxisInterval(dataLength: number) {
  if (dataLength <= 24) {
    return 2;
  }

  return Math.max(Math.floor(dataLength / 8), 1);
}

export function ScenarioFacilityChart({ points }: Readonly<{ points: ScenarioProjectionPoint[] }>) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="monthLabel" stroke="#57657a" tickLine={false} axisLine={false} interval={getXAxisInterval(points.length)} />
          <YAxis stroke="#57657a" tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labelMap: Record<string, string> = {
                purchaseDebtBalance: "Purchase debt",
                existingPropertyDebtBalance: "Existing property debt",
                propertyEquity: "Target property equity",
                retainedPropertyEquity: "Retained property equity",
              };

              return [`$${value.toLocaleString()}`, labelMap[name] ?? name];
            }}
          />
          <Legend
            formatter={(value) => {
              const labelMap: Record<string, string> = {
                purchaseDebtBalance: "Purchase debt",
                existingPropertyDebtBalance: "Existing property debt",
                propertyEquity: "Target property equity",
                retainedPropertyEquity: "Retained property equity",
              };

              return labelMap[value] ?? value;
            }}
          />
          <Line type="monotone" dataKey="purchaseDebtBalance" stroke="#012169" strokeWidth={3} dot={false} name="purchaseDebtBalance" />
          <Line type="monotone" dataKey="existingPropertyDebtBalance" stroke="#8c3a1f" strokeWidth={2} dot={false} name="existingPropertyDebtBalance" />
          <Line type="monotone" dataKey="propertyEquity" stroke="#2a7f62" strokeWidth={2} dot={false} name="propertyEquity" />
          <Line type="monotone" dataKey="retainedPropertyEquity" stroke="#c27b2f" strokeWidth={2} dot={false} name="retainedPropertyEquity" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}