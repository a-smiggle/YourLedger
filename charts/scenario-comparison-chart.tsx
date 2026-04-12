"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getTimeSeriesXAxisInterval } from "@/charts/chart-presentation";
import { useCompactLayout } from "@/hooks/use-compact-layout";

type ScenarioComparisonSeries = {
  key: string;
  label: string;
  color: string;
};

type ScenarioComparisonChartProps = {
  data: Array<Record<string, number | string | null>>;
  series: ScenarioComparisonSeries[];
  valueFormatter?: (value: number) => string;
  axisTickFormatter?: (value: number) => string;
};

export function ScenarioComparisonChart({ data, series, valueFormatter, axisTickFormatter }: Readonly<ScenarioComparisonChartProps>) {
  const isCompact = useCompactLayout();
  const labelMap = Object.fromEntries(series.map((item) => [item.key, item.label]));
  const formatValue = valueFormatter ?? ((value: number) => `$${value.toLocaleString()}`);
  const formatAxisTick = axisTickFormatter ?? ((value: number) => `$${Math.round(value / 1000)}k`);

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            stroke="#57657a"
            tickLine={false}
            axisLine={false}
            interval={getTimeSeriesXAxisInterval(data.length, isCompact)}
            tick={{ fontSize: isCompact ? 11 : 12 }}
            tickMargin={8}
            minTickGap={isCompact ? 20 : 12}
          />
          <YAxis
            stroke="#57657a"
            tickFormatter={formatAxisTick}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isCompact ? 11 : 12 }}
            width={isCompact ? 42 : 60}
          />
          <Tooltip
            formatter={(value: number | string | null, name: string) => {
              if (typeof value !== "number") {
                return [value, labelMap[name] ?? name];
              }

              return [formatValue(value), labelMap[name] ?? name];
            }}
          />
          <Legend formatter={(value) => labelMap[value] ?? value} iconSize={isCompact ? 10 : 14} wrapperStyle={{ fontSize: isCompact ? 11 : 12, paddingTop: 8 }} />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              stroke={item.color}
              strokeWidth={2.5}
              dot={false}
              connectNulls
              name={item.key}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}