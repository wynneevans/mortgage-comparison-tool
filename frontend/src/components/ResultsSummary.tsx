import type { OfferResult } from "../types/mortgage";

interface ResultsSummaryProps {
  results: OfferResult[];
}

function fmt(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  return (
    <div className="results-summary">
      <h2>Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Offer</th>
            <th>Total Paid</th>
            <th>Total Interest</th>
            <th>Total Principal</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{fmt(r.total_paid)}</td>
              <td>{fmt(r.total_interest)}</td>
              <td>{fmt(r.total_principal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {results.length >= 2 && (
        <p className="difference">
          Difference in total paid:{" "}
          <strong>
            {fmt(Math.abs(results[0].total_paid - results[1].total_paid))}
          </strong>
        </p>
      )}
    </div>
  );
}
