from fastapi import APIRouter

from mortgage_api.calculator import calculate_offer
from mortgage_api.models import CompareRequest, CompareResponse

router = APIRouter(prefix="/api")


@router.post("/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    results = [
        calculate_offer(offer, request.loan_amount, request.total_term_years)
        for offer in request.offers
    ]
    return CompareResponse(results=results)
