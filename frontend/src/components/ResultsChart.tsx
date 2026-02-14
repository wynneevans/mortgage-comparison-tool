import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { OfferResult } from "../types/mortgage";

const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#be185d", "#4d7c0f", "#9333ea", "#ea580c",
];

interface ResultsChartProps {
  results: OfferResult[];
}

export function ResultsChart({ results }: ResultsChartProps) {
  // Build a merged dataset keyed by month
  const months = results[0].schedule.length;
  const data = Array.from({ length: months }, (_, i) => {
    const point: Record<string, number> = { month: i + 1 };
    results.forEach((r) => {
      point[r.label] = r.schedule[i].remaining_balance;
    });
    return point;
  });

  // Find fixed period boundaries for reference areas
  const fixedAreas = results.map((r) => {
    const lastFixed = r.schedule.findLastIndex((dp) => dp.is_fixed_period);
    return { label: r.label, endMonth: lastFixed >= 0 ? lastFixed + 1 : 0 };
  });

  return (
    <div className="chart-container">
      <h2>Balance Over Time</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            label={{ value: "Month", position: "insideBottom", offset: -5 }}
            tickFormatter={(m: number) =>
              m % 60 === 0 ? `${m / 12}y` : ""
            }
          />
          <YAxis
            tickFormatter={(v: number) =>
              `£${(v / 1000).toFixed(0)}k`
            }
          />
          <Tooltip
            formatter={(value: number) =>
              `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
            labelFormatter={(month: number) =>
              `Month ${month} (Year ${Math.ceil(month / 12)})`
            }
          />
          <Legend />
          {fixedAreas.map(
            (area, i) =>
              area.endMonth > 0 && (
                <ReferenceArea
                  key={area.label}
                  x1={1}
                  x2={area.endMonth}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.05}
                />
              )
          )}
          {results.map((r, i) => (
            <Line
              key={r.label}
              type="monotone"
              dataKey={r.label}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
