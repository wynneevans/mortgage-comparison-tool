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

interface PaymentsChartProps {
  results: OfferResult[];
  colors: string[];
}

function BlockLabel({
  viewBox,
  rates,
}: {
  viewBox?: { x: number; y: number; width: number; height: number };
  rates: { label: string; rate: number | undefined; color: string }[];
}) {
  if (!viewBox) return null;
  const { x, y, width } = viewBox;
  const cx = x + width / 2;
  const LINE_H = 14;

  return (
    <>
      {rates.map((r, i) => (
        <text
          key={r.label}
          x={cx}
          y={y + 12 + i * LINE_H}
          textAnchor="middle"
          fontSize={10}
          fill={r.color}
          fontWeight="600"
        >
          {r.label}: {r.rate !== undefined ? `${r.rate.toFixed(2)}%` : "—"}
        </text>
      ))}
    </>
  );
}

export function PaymentsChart({ results, colors }: PaymentsChartProps) {
  // Find fixed period boundaries
  const fixedAreas = results.map((r) => {
    const lastFixed = r.schedule.findLastIndex((dp) => dp.is_fixed_period);
    return { label: r.label, endMonth: lastFixed >= 0 ? lastFixed + 1 : 0 };
  });

  const maxFixedMonth = Math.max(...fixedAreas.map((a) => a.endMonth));

  // Compute per-block boundaries and rate annotations
  const sortedEndMonths = [...new Set(fixedAreas.map((a) => a.endMonth))]
    .filter((m) => m > 0)
    .sort((a, b) => a - b);

  const blockBoundaries: { x1: number; x2: number }[] = [];
  let prev = 1;
  for (const end of sortedEndMonths) {
    blockBoundaries.push({ x1: prev, x2: end });
    prev = end + 1;
  }

  const blockAnnotations = blockBoundaries.map(({ x1, x2 }) => {
    const idx = x1 - 1;
    const rates = results.map((r, i) => ({
      label: r.label,
      rate: r.schedule[idx]?.annual_rate,
      color: colors[i],
    }));
    return { x1, x2, rates };
  });

  const monthTicks = Array.from({ length: maxFixedMonth }, (_, i) => i + 1);

  // Build merged dataset with cumulative sums up to longest fixed period
  const runningTotals = new Map<string, number>(results.map((r) => [r.label, 0]));
  const chartData = Array.from({ length: maxFixedMonth }, (_, i) => {
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

    // Derive future rate from the first post-fixed month in the schedule
    const firstPostFixed = r.schedule.find((dp) => !dp.is_fixed_period);
    const futureRate = firstPostFixed?.annual_rate;

    return {
      label: r.label,
      total,
      monthsAtScenario,
      futureRate,
      color: colors[i],
    };
  });

  const minTotal = Math.min(...totals.map((t) => t.total));

  return (
    <div className="chart-container">
      <h2>Cumulative Repayments</h2>
      <div className="chart-with-summary">
      <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            ticks={monthTicks}
            tickFormatter={(m: number) => m % 12 === 0 ? `${m / 12}y` : ""}
            interval={0}
            tickLine={false}
            minTickGap={0}
          />
          <YAxis
            tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) =>
              value !== undefined
                ? [formatCurrency(value), name ?? ""]
                : ["", ""]
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
              ),
          )}
          {blockAnnotations.map(({ x1, x2, rates }) => (
            <ReferenceArea
              key={`label-${x1}-${x2}`}
              x1={x1}
              x2={x2}
              fill="none"
              stroke="none"
              label={<BlockLabel rates={rates} />}
              ifOverflow="visible"
            />
          ))}
          {results.map((r, i) => (
            <Line
              key={`${r.label}-${i}`}
              type="stepAfter"
              dataKey={r.label}
              stroke={colors[i]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      <div className="chart-totals">
        <h3>
          Total over {Math.round(maxFixedMonth / 12)} year
          {maxFixedMonth > 12 ? "s" : ""}
        </h3>
        <ul>
          {totals.map((t, index) => {
            const diff = t.total - minTotal;
            return (
              <li key={`${t.label}-${index}`} style={{ color: t.color }}>
                <div className="totals-label">{t.label}</div>
                <div className="totals-amount">{formatCurrency(t.total)}</div>
                {diff > 0 ? (
                  <div className="totals-diff totals-diff--more">
                    +{formatCurrency(diff)} more
                  </div>
                ) : (
                  <div className="totals-diff totals-diff--cheapest">
                    cheapest
                  </div>
                )}
                {t.monthsAtScenario > 0 && t.futureRate != null && (
                  <div className="scenario-note">
                    {t.monthsAtScenario}mo at {t.futureRate}% future rate
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      </div>
    </div>
  );
}
