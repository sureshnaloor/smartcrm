"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

import { cn } from "@/lib/utils"
import type { TooltipProps } from "recharts"

// Define color mappings for chart elements
const colorMappings = {
  primary: "#3b82f6", // Blue
  secondary: "#6366f1", // Indigo
  success: "#22c55e", // Green
  danger: "#ef4444", // Red
  warning: "#f59e0b", // Amber
  info: "#06b6d4", // Cyan
  muted: "#6b7280", // Gray
};

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showYAxis?: boolean;
  showXAxis?: boolean;
  chartType?: "bar" | "line" | "area" | "pie";
  stack?: boolean;
  height?: string | number;
  width?: string | number;
}

/**
 * Reusable Chart component that supports different chart types and data visualizations
 */
export function Chart({
  data = [],
  index = "",
  categories = [],
  colors = ["primary"],
  valueFormatter,
  showLegend = true,
  showYAxis = true,
  showXAxis = true,
  chartType = "bar",
  stack = false,
  height = "100%",
  width = "100%",
  ...props
}: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400">No data available</div>;
  }

  // Map string color names to actual color values
  const chartColors = colors.map((color: keyof typeof colorMappings | string) => 
    colorMappings[color as keyof typeof colorMappings] || color
  );

  // Format the value for tooltip
  const formatValue = (value: number | undefined) => {
    if (valueFormatter && typeof value === 'number') {
      return valueFormatter(value);
    }
    return value;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render the appropriate chart based on chartType
  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data} {...props}>
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Bar 
                key={category}
                dataKey={category} 
                fill={chartColors[i % chartColors.length]}
                stackId={stack ? "stack" : undefined}
              />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data} {...props}>
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Line 
                key={category}
                type="monotone" 
                dataKey={category} 
                stroke={chartColors[i % chartColors.length]}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={data} {...props}>
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Area 
                key={category}
                type="monotone" 
                dataKey={category} 
                fill={chartColors[i % chartColors.length]}
                stroke={chartColors[i % chartColors.length]}
                fillOpacity={0.3}
                stackId={stack ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart {...props}>
            <Pie
              data={data}
              nameKey={index}
              dataKey={categories[0]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry) => `${entry.name}: ${formatValue(entry[categories[0]])}`}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={chartColors[i % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        );
      default:
        return (
          <BarChart data={data} {...props}>
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Bar 
                key={category}
                dataKey={category} 
                fill={chartColors[i % chartColors.length]}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
