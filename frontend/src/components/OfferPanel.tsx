import type { Offer } from "../types/mortgage";
import { OfferForm } from "./OfferForm";

interface OfferPanelProps {
  offer: Offer;
  index: number;
  canRemove: boolean;
  onChange: (offer: Offer) => void;
  onRemove: () => void;
}

export function OfferPanel({
  offer,
  index,
  canRemove,
  onChange,
  onRemove,
}: OfferPanelProps) {
  return (
    <div className="offer-panel">
      <div className="offer-header">
        <h3>Offer {index + 1}</h3>
        {canRemove && (
          <button className="remove-btn" onClick={onRemove} title="Remove offer">
            &times;
          </button>
        )}
      </div>
      <OfferForm offer={offer} onChange={onChange} />
    </div>
  );
}
