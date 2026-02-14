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
import type { Offer, OfferResult } from "../types/mortgage";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

interface PaymentsChartProps {
  results: OfferResult[];
  offers: Offer[];
}

export function PaymentsChart({ results, offers }: PaymentsChartProps) {
  // Find fixed period boundaries
  const fixedAreas = results.map((r) => {
    const lastFixed = r.schedule.findLastIndex((dp) => dp.is_fixed_period);
    return { label: r.label, endMonth: lastFixed >= 0 ? lastFixed + 1 : 0 };
  });

  const maxFixedMonth = Math.max(...fixedAreas.map((a) => a.endMonth));

  // Build merged dataset with cumulative sums over the full term
  const months = results[0].schedule.length;
  const runningTotals = new Map<string, number>(results.map((r) => [r.label, 0]));
  const chartData = Array.from({ length: months }, (_, i) => {
    const point: Record<string, number> = { month: i + 1 };
    results.forEach((r) => {
      const prev = runningTotals.get(r.label)!;
      const cumulative = prev + r.schedule[i].payment;
      runningTotals.set(r.label, cumulative);
      point[r.label] = cumulative;
    });
    return point;
  });

  // Compute totals for the chart period
  const totals = results.map((r, i) => {
    const total = r.schedule
      .slice(0, maxFixedMonth)
      .reduce((sum, dp) => sum + dp.payment, 0);

    const fixedEndMonth = fixedAreas[i].endMonth;
    const monthsAtScenario =
      fixedEndMonth < maxFixedMonth ? maxFixedMonth - fixedEndMonth : 0;

    const offer = offers.find((o) => o.label === r.label);
    const scenarioRate = offer?.scenario_rate;

    return {
      label: r.label,
      total,
      monthsAtScenario,
      scenarioRate,
      color: COLORS[i],
    };
  });

  return (
    <div className="chart-container">
      <h2>Cumulative Repayments</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            label={{ value: "Month", position: "insideBottom", offset: -5 }}
            tickFormatter={(m: number) => (m % 60 === 0 ? `${m / 12}y` : "")}
          />
          <YAxis
            tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [
              `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              "Cumulative total paid",
            ]}
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
                  fill={COLORS[i]}
                  fillOpacity={0.05}
                />
              ),
          )}
          {results.map((r, i) => (
            <Line
              key={r.label}
              type="stepAfter"
              dataKey={r.label}
              stroke={COLORS[i]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="chart-totals">
        <h3>
          Total paid over {Math.round(maxFixedMonth / 12)} year
          {maxFixedMonth > 12 ? "s" : ""}
        </h3>
        <ul>
          {totals.map((t) => (
            <li key={t.label} style={{ color: t.color }}>
              <strong>{t.label}:</strong>{" "}
              £{t.total.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {t.monthsAtScenario > 0 && t.scenarioRate != null && (
                <span className="scenario-note">
                  {" "}(includes {t.monthsAtScenario} months at scenario rate of {t.scenarioRate}%)
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
