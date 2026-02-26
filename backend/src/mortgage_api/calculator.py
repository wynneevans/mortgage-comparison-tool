from .models import MonthlyDataPoint, Offer, OfferResult


def _monthly_repayment(balance: float, annual_rate_pct: float, months: int) -> float:
    """Calculate monthly repayment using standard annuity formula."""
    if months <= 0:
        return 0.0
    r = annual_rate_pct / 100 / 12
    if r == 0:
        return balance / months
    return balance * r * (1 + r) ** months / ((1 + r) ** months - 1)


def _monthly_interest_only(balance: float, annual_rate_pct: float) -> float:
    """Calculate monthly interest-only payment."""
    return balance * (annual_rate_pct / 100 / 12)


def calculate_offer(
    offer: Offer,
    loan_amount: float,
    total_term_years: int,
    interim_rate: float | None = None,
    longest_fixed_months: int | None = None,
    long_term_rate: float | None = None,
) -> OfferResult:
    """Generate a full month-by-month schedule for a single offer."""
    total_months = total_term_years * 12
    fixed_months = offer.fixed_term_years * 12
    is_interest_only = offer.mortgage_type == "interest_only"
    effective_interim_rate = interim_rate if interim_rate is not None else offer.interim_rates[0]
    effective_longest_fixed = longest_fixed_months if longest_fixed_months is not None else fixed_months
    effective_long_term_rate = long_term_rate if long_term_rate is not None else effective_interim_rate

    schedule: list[MonthlyDataPoint] = []
    balance = loan_amount
    total_paid = 0.0
    total_interest = 0.0
    total_principal = 0.0

    for month in range(1, total_months + 1):
        if balance <= 0.01:
            break

        in_fixed = month <= fixed_months
        if month <= fixed_months:
            rate = offer.interest_rate
        elif month <= effective_longest_fixed:
            rate = effective_interim_rate
        else:
            rate = effective_long_term_rate
        remaining_months = total_months - month + 1

        monthly_interest = balance * (rate / 100 / 12)

        if is_interest_only:
            payment = _monthly_interest_only(balance, rate)
            principal_paid = 0.0
        else:
            payment = _monthly_repayment(balance, rate, remaining_months)
            principal_paid = payment - monthly_interest

        # Guard against floating-point overshoot on final payment
        if principal_paid > balance:
            principal_paid = balance
            payment = principal_paid + monthly_interest

        balance -= principal_paid
        if balance < 0.01:
            balance = 0.0

        total_paid += payment
        total_interest += monthly_interest
        total_principal += principal_paid

        schedule.append(
            MonthlyDataPoint(
                month=month,
                payment=round(payment, 2),
                principal=round(principal_paid, 2),
                interest=round(monthly_interest, 2),
                remaining_balance=round(balance, 2),
                annual_rate=rate,
                is_fixed_period=in_fixed,
            )
        )

    return OfferResult(
        label=offer.label,
        schedule=schedule,
        total_paid=round(total_paid, 2),
        total_interest=round(total_interest, 2),
        total_principal=round(total_principal, 2),
    )
