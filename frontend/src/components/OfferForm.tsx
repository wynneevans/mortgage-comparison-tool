import type { Offer } from "../types/mortgage";
import { ScenarioInput } from "./ScenarioInput";

interface OfferFormProps {
  offer: Offer;
  onChange: (offer: Offer) => void;
}

export function OfferForm({ offer, onChange }: OfferFormProps) {
  const update = (partial: Partial<Offer>) =>
    onChange({ ...offer, ...partial });

  return (
    <div className="offer-form">
      <div className="field">
        <label>Label</label>
        <input
          type="text"
          value={offer.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Interest rate (%)</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          max="100"
          value={offer.interest_rate}
          onChange={(e) =>
            update({ interest_rate: parseFloat(e.target.value) || 0 })
          }
        />
      </div>
      <div className="field">
        <label>Fixed term (years)</label>
        <input
          type="number"
          step="1"
          min="1"
          max="40"
          value={offer.fixed_term_years}
          onChange={(e) =>
            update({ fixed_term_years: parseInt(e.target.value) || 1 })
          }
        />
      </div>
      <div className="field">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={offer.mortgage_type === "interest_only"}
            onChange={(e) =>
              update({
                mortgage_type: e.target.checked ? "interest_only" : "repayment",
              })
            }
          />
          <span className="toggle-text">Interest only</span>
        </label>
      </div>
      <ScenarioInput
        value={offer.scenario_rate}
        onChange={(scenario_rate) => update({ scenario_rate })}
      />
    </div>
  );
}
