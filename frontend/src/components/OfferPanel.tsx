import type { Offer } from "../types/mortgage";
import { OfferForm } from "./OfferForm";

interface OfferPanelProps {
  offer: Offer;
  canRemove: boolean;
  onChange: (offer: Offer) => void;
  onRemove: () => void;
}

export function OfferPanel({
  offer,
  canRemove,
  onChange,
  onRemove,
}: OfferPanelProps) {
  return (
    <div className="offer-panel">
      {canRemove && (
        <div className="offer-header">
          <button className="remove-btn" onClick={onRemove} title="Remove offer">
            &times;
          </button>
        </div>
      )}
      <OfferForm offer={offer} onChange={onChange} />
    </div>
  );
}
