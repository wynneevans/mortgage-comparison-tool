from fastapi import APIRouter

from mortgage_api.calculator import calculate_offer
from mortgage_api.models import CompareRequest, CompareResponse

router = APIRouter(prefix="/api")


@router.post("/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    results = []
    for offer in request.offers:
        for rate in offer.scenario_rates:
            label = (
                f"{offer.label} @ {rate}%"
                if len(offer.scenario_rates) > 1
                else offer.label
            )
            result = calculate_offer(
                offer, request.loan_amount, request.total_term_years, scenario_rate=rate
            )
            result.label = label
            results.append(result)
    return CompareResponse(results=results)
