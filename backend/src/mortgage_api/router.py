from fastapi import APIRouter

from .calculator import calculate_offer
from .models import CompareRequest, CompareResponse

router = APIRouter(prefix="/api")


@router.post("/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    longest_fixed_months = max(o.fixed_term_years for o in request.offers) * 12
    results = []
    for offer in request.offers:
        for rate in offer.interim_rates:
            label = (
                f"{offer.label} @ {rate}%"
                if len(offer.interim_rates) > 1
                else offer.label
            )
            result = calculate_offer(
                offer,
                request.loan_amount,
                request.total_term_years,
                interim_rate=rate,
                longest_fixed_months=longest_fixed_months,
                long_term_rate=request.long_term_rate,
            )
            results.append(result.model_copy(update={"label": label}))
    return CompareResponse(results=results)
