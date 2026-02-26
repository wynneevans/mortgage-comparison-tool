import { formatCurrency } from "../utils/format";
import type { OfferResult } from "../types/mortgage";

interface ResultsSummaryProps {
  results: OfferResult[];
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
          {results.map((r, index) => (
            <tr key={`${r.label}-${index}`}>
              <td>{r.label}</td>
              <td>{formatCurrency(r.total_paid)}</td>
              <td>{formatCurrency(r.total_interest)}</td>
              <td>{formatCurrency(r.total_principal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {results.length >= 2 && (
        <p className="difference">
          Difference in total paid:{" "}
          <strong>
            {formatCurrency(Math.abs(results[0].total_paid - results[1].total_paid))}
          </strong>
        </p>
      )}
    </div>
  );
}
