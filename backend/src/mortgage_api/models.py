from pydantic import BaseModel, Field


class Offer(BaseModel):
    label: str = Field(description="Display name for this offer, e.g. '2-year fix'")
    interest_rate: float = Field(
        gt=0, le=100, description="Annual interest rate during fixed period (%)"
    )
    fixed_term_years: int = Field(
        gt=0, le=40, description="Length of fixed-rate period in years"
    )
    mortgage_type: str = Field(
        default="repayment",
        pattern="^(repayment|interest_only)$",
        description="'repayment' or 'interest_only'",
    )
    interim_rates: list[float] = Field(
        min_length=1,
        description="Annual interest rates after fixed period ends until longest fixed period (%), one per scenario",
    )


class CompareRequest(BaseModel):
    loan_amount: float = Field(gt=0, description="Initial loan amount in £")
    total_term_years: int = Field(
        default=25, gt=0, le=40, description="Full mortgage term in years"
    )
    long_term_rate: float = Field(
        default=5.5,
        gt=0,
        le=100,
        description="Annual interest rate after longest fixed period ends (%)",
    )
    offers: list[Offer] = Field(
        min_length=1, max_length=5, description="1-5 mortgage offers to compare"
    )


class MonthlyDataPoint(BaseModel):
    month: int
    payment: float
    principal: float
    interest: float
    remaining_balance: float
    annual_rate: float
    is_fixed_period: bool


class OfferResult(BaseModel):
    label: str
    schedule: list[MonthlyDataPoint]
    total_paid: float
    total_interest: float
    total_principal: float


class CompareResponse(BaseModel):
    results: list[OfferResult]
