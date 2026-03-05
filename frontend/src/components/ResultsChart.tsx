import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../utils/format";
import type { OfferResult } from "../types/mortgage";

interface ResultsChartProps {
  results: OfferResult[];
  colors: string[];
}

export function ResultsChart({ results, colors }: ResultsChartProps) {
  // Build a merged dataset keyed by month
  const months = results[0].schedule.length;
  const data = Array.from({ length: months }, (_, i) => {
    const point: Record<string, number> = { month: i + 1 };
    results.forEach((r) => {
      point[r.label] = r.schedule[i].remaining_balance;
    });
    return point;
  });

  const yearTicks = Array.from({ length: Math.ceil(months / 12) }, (_, i) => (i + 1) * 12).filter(m => m <= months);

  // Find fixed period boundaries for reference areas
  const fixedAreas = results.map((r) => {
    const lastFixed = r.schedule.findLastIndex((dp) => dp.is_fixed_period);
    return { label: r.label, endMonth: lastFixed >= 0 ? lastFixed + 1 : 0 };
  });

  return (
    <div className="chart-container">
      <h2>Balance Over Time</h2>
      <div className="chart-with-summary">
        <div className="chart-area">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                ticks={yearTicks}
                tickFormatter={(m: number) => m % 60 === 0 ? `${m / 12}y` : ""}
                interval={0}
                tickLine={false}
                minTickGap={0}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  `£${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value: number | undefined) =>
                  value !== undefined ? formatCurrency(value) : ""
                }
                labelFormatter={(month: unknown) =>
                  typeof month === "number"
                    ? `Month ${month} (Year ${Math.ceil(month / 12)})`
                    : ""
                }
              />
              {fixedAreas.map(
                (area, i) =>
                  area.endMonth > 0 && (
                    <ReferenceArea
                      key={`${area.label}-${i}`}
                      x1={1}
                      x2={area.endMonth}
                      fill={colors[i]}
                      fillOpacity={0.05}
                    />
                  )
              )}
              {results.map((r, i) => (
                <Line
                  key={`${r.label}-${i}`}
                  type="monotone"
                  dataKey={r.label}
                  stroke={colors[i]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-summary">
          <h3>Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Offer</th>
                <th>Total Paid</th>
                <th>Interest</th>
                <th>Principal</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const minPaid = Math.min(...results.map((r) => r.total_paid));
                return results.map((r, i) => {
                  const diff = r.total_paid - minPaid;
                  return (
                    <tr key={i} style={{ color: colors[i] }}>
                      <td>{r.label}</td>
                      <td>{formatCurrency(r.total_paid)}</td>
                      <td>{formatCurrency(r.total_interest)}</td>
                      <td>{formatCurrency(r.total_principal)}</td>
                      <td>{diff === 0 ? "—" : `+${formatCurrency(diff)}`}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
