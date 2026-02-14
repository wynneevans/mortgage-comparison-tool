import pytest

from mortgage_api.calculator import _monthly_repayment, calculate_offer
from mortgage_api.models import Offer


def test_monthly_repayment_basic():
    """£200k at 5% over 25 years ≈ £1,169.18/month."""
    payment = _monthly_repayment(200_000, 5.0, 300)
    assert round(payment, 2) == 1169.18


def test_monthly_repayment_zero_rate():
    payment = _monthly_repayment(120_000, 0.0, 120)
    assert round(payment, 2) == 1000.00


def test_repayment_offer_full_schedule():
    offer = Offer(
        label="2-year fix",
        interest_rate=4.0,
        fixed_term_years=2,
        mortgage_type="repayment",
        interim_rates=[6.0],
    )
    result = calculate_offer(offer, loan_amount=200_000, total_term_years=25)

    assert result.label == "2-year fix"
    assert len(result.schedule) == 300  # 25 years * 12
    assert result.schedule[0].is_fixed_period is True
    assert result.schedule[0].annual_rate == 4.0
    assert result.schedule[23].is_fixed_period is True  # month 24 still fixed
    assert result.schedule[24].is_fixed_period is False  # month 25 scenario
    assert result.schedule[24].annual_rate == 6.0
    assert result.schedule[-1].remaining_balance == 0.0
    assert result.total_principal == pytest.approx(200_000, abs=1)


def test_interest_only_offer():
    offer = Offer(
        label="IO deal",
        interest_rate=3.5,
        fixed_term_years=5,
        mortgage_type="interest_only",
        interim_rates=[5.0],
    )
    result = calculate_offer(offer, loan_amount=150_000, total_term_years=25)

    # Interest-only: balance never decreases
    assert result.schedule[-1].remaining_balance == 150_000.0
    assert result.total_principal == 0.0

    # Fixed period payment = 150000 * 3.5% / 12
    expected_fixed_payment = round(150_000 * 0.035 / 12, 2)
    assert result.schedule[0].payment == expected_fixed_payment

    # Scenario period payment = 150000 * 5% / 12
    expected_scenario_payment = round(150_000 * 0.05 / 12, 2)
    assert result.schedule[60].payment == expected_scenario_payment


def test_fixed_term_equals_total_term():
    """When fixed term = total term, no scenario rate is used."""
    offer = Offer(
        label="Full fix",
        interest_rate=4.5,
        fixed_term_years=25,
        mortgage_type="repayment",
        interim_rates=[6.0],
    )
    result = calculate_offer(offer, loan_amount=200_000, total_term_years=25)

    assert all(dp.is_fixed_period for dp in result.schedule)
    assert all(dp.annual_rate == 4.5 for dp in result.schedule)
    assert result.schedule[-1].remaining_balance == 0.0


def test_three_period_rate_logic():
    """Verify fixed → interim → long-term rate transitions."""
    offer = Offer(
        label="2-year fix",
        interest_rate=4.0,
        fixed_term_years=2,
        mortgage_type="repayment",
        interim_rates=[6.0],
    )
    result = calculate_offer(
        offer,
        loan_amount=200_000,
        total_term_years=25,
        interim_rate=6.0,
        longest_fixed_months=60,  # 5-year longest fixed
        long_term_rate=5.0,
    )

    # Month 1-24: fixed at 4.0%
    assert result.schedule[0].annual_rate == 4.0
    assert result.schedule[23].annual_rate == 4.0

    # Month 25-60: interim at 6.0%
    assert result.schedule[24].annual_rate == 6.0
    assert result.schedule[59].annual_rate == 6.0

    # Month 61+: long-term at 5.0%
    assert result.schedule[60].annual_rate == 5.0
    assert result.schedule[-1].annual_rate == 5.0

    assert result.schedule[-1].remaining_balance == 0.0


def test_total_paid_exceeds_loan():
    """Total paid should always exceed loan amount for repayment mortgages."""
    offer = Offer(
        label="Test",
        interest_rate=5.0,
        fixed_term_years=2,
        mortgage_type="repayment",
        interim_rates=[5.0],
    )
    result = calculate_offer(offer, loan_amount=100_000, total_term_years=25)
    assert result.total_paid > 100_000
    assert result.total_interest > 0
