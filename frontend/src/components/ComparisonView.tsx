import type { Offer } from "../types/mortgage";
import { useMortgage } from "../hooks/useMortgage";
import { OfferPanel } from "./OfferPanel";
import { ResultsChart } from "./ResultsChart";
import { ResultsSummary } from "./ResultsSummary";

export function ComparisonView() {
  const { state, dispatch, compare } = useMortgage();

  return (
    <div className="comparison-view">
      <div className="global-inputs">
        <div className="field">
          <label>Loan amount (£)</label>
          <input
            type="number"
            step="1000"
            min="1"
            value={state.loanAmount}
            onChange={(e) =>
              dispatch({
                type: "SET_LOAN_AMOUNT",
                value: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="field">
          <label>Total term (years)</label>
          <input
            type="number"
            step="1"
            min="1"
            max="40"
            value={state.totalTermYears}
            onChange={(e) =>
              dispatch({
                type: "SET_TOTAL_TERM",
                value: parseInt(e.target.value) || 1,
              })
            }
          />
        </div>
      </div>

      <div className="offers-row">
        {state.offers.map((offer: Offer, i: number) => (
          <OfferPanel
            key={i}
            offer={offer}
            index={i}
            canRemove={state.offers.length > 2}
            onChange={(updated) =>
              dispatch({ type: "UPDATE_OFFER", index: i, offer: updated })
            }
            onRemove={() => dispatch({ type: "REMOVE_OFFER", index: i })}
          />
        ))}
      </div>

      <div className="actions">
        {state.offers.length < 5 && (
          <button
            className="btn-secondary"
            onClick={() => dispatch({ type: "ADD_OFFER" })}
          >
            + Add offer
          </button>
        )}
        <button
          className="btn-primary"
          onClick={compare}
          disabled={state.loading}
        >
          {state.loading ? "Calculating..." : "Compare"}
        </button>
      </div>

      {state.error && <p className="error">{state.error}</p>}

      {state.results && (
        <div className="results">
          <ResultsChart results={state.results.results} />
          <ResultsSummary results={state.results.results} />
        </div>
      )}
    </div>
  );
}
