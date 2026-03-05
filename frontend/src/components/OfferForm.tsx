import type { Offer } from "../types/mortgage";
import { NumericInput } from "./NumericInput";

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
        <NumericInput
          value={offer.interest_rate}
          step="0.1"
          min={0.1}
          max={100}
          onChange={(value) => update({ interest_rate: value })}
        />
      </div>
      <div className="field">
        <label>Fixed term (years)</label>
        <NumericInput
          value={offer.fixed_term_years}
          step="1"
          min={1}
          max={40}
          integer
          onChange={(value) => update({ fixed_term_years: value })}
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
    </div>
  );
}
