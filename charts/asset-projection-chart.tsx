"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AssetProjectionPoint } from "@/types/domain";

export function AssetProjectionChart({ points }: Readonly<{ points: AssetProjectionPoint[] }>) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="monthLabel" stroke="#57657a" tickLine={false} axisLine={false} />
          <YAxis stroke="#57657a" tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Projected balance"]} />
          <Legend />
          <Line type="monotone" dataKey="totalProjectedAssets" stroke="#012169" strokeWidth={3} dot={false} name="Total assets" />
          <Line type="monotone" dataKey="totalProjectedCash" stroke="#2a7f62" strokeWidth={2} dot={false} name="Cash" />
          <Line type="monotone" dataKey="totalProjectedSuper" stroke="#c27b2f" strokeWidth={2} dot={false} name="Super" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}