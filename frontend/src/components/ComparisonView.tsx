import { useMortgage } from "../hooks/useMortgage";
import { NumericInput } from "./NumericInput";
import { OfferPanel } from "./OfferPanel";
import { PaymentsChart } from "./PaymentsChart";
import { ResultsChart } from "./ResultsChart";

export function ComparisonView() {
  const { state, dispatch, compare } = useMortgage();

  return (
    <div className="comparison-view">
      <div className="global-inputs">
        <div className="field">
          <label>Loan amount (£)</label>
          <NumericInput
            value={state.loanAmount}
            step="1000"
            min={1}
            integer
            onChange={(value) => dispatch({ type: "SET_LOAN_AMOUNT", value })}
          />
        </div>
        <div className="field">
          <label>Total term (years)</label>
          <NumericInput
            value={state.totalTermYears}
            step="1"
            min={1}
            max={40}
            integer
            onChange={(value) => dispatch({ type: "SET_TOTAL_TERM", value })}
          />
        </div>
        <div className="field">
          <label>Future rate (%)</label>
          <NumericInput
            value={state.futureRate}
            step="0.1"
            min={0.1}
            max={100}
            onChange={(value) => dispatch({ type: "SET_FUTURE_RATE", value })}
          />
        </div>
      </div>

      <div className="offers-row">
        {state.offers.map((offer, i) => (
          <OfferPanel
            key={state.offerIds[i]}
            offer={offer}
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
          <PaymentsChart results={state.results.results} colors={state.results.colors} />
          <ResultsChart results={state.results.results} colors={state.results.colors} />
        </div>
      )}
    </div>
  );
}
