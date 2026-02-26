from fastapi.testclient import TestClient

from mortgage_api.main import app

client = TestClient(app)


def test_compare_basic():
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 200_000,
            "total_term_years": 25,
            "long_term_rate": 5.0,
            "offers": [
                {
                    "label": "2-year fix",
                    "interest_rate": 4.0,
                    "fixed_term_years": 2,
                    "mortgage_type": "repayment",
                    "interim_rates": [6.0],
                },
                {
                    "label": "5-year fix",
                    "interest_rate": 4.5,
                    "fixed_term_years": 5,
                    "mortgage_type": "repayment",
                    "interim_rates": [6.0],
                },
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 2
    assert data["results"][0]["label"] == "2-year fix"
    assert data["results"][1]["label"] == "5-year fix"
    assert len(data["results"][0]["schedule"]) == 300
    assert len(data["results"][1]["schedule"]) == 300


def test_compare_validation_no_offers():
    response = client.post(
        "/api/compare",
        json={"loan_amount": 200_000, "offers": []},
    )
    assert response.status_code == 422


def test_compare_validation_bad_rate():
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 200_000,
            "offers": [
                {
                    "label": "Bad",
                    "interest_rate": -1,
                    "fixed_term_years": 2,
                    "interim_rates": [5.0],
                }
            ],
        },
    )
    assert response.status_code == 422


def test_compare_single_offer():
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 150_000,
            "total_term_years": 30,
            "offers": [
                {
                    "label": "Solo",
                    "interest_rate": 3.5,
                    "fixed_term_years": 5,
                    "mortgage_type": "interest_only",
                    "interim_rates": [5.5],
                }
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    # Interest-only: balance stays at loan amount
    assert data["results"][0]["schedule"][-1]["remaining_balance"] == 150_000.0


def test_compare_validation_bad_interim_rate():
    """interim_rates items must be > 0 and <= 100."""
    for bad_rate in [-1.0, 101.0]:
        response = client.post(
            "/api/compare",
            json={
                "loan_amount": 200_000,
                "offers": [{"label": "Bad", "interest_rate": 4.0,
                             "fixed_term_years": 2, "interim_rates": [bad_rate]}],
            },
        )
        assert response.status_code == 422


def test_compare_three_period_rates():
    """The 2-year fix should use interim rate from month 25-60, then long-term rate."""
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 200_000,
            "total_term_years": 25,
            "long_term_rate": 5.0,
            "offers": [
                {
                    "label": "2-year fix",
                    "interest_rate": 4.0,
                    "fixed_term_years": 2,
                    "interim_rates": [6.0],
                },
                {
                    "label": "5-year fix",
                    "interest_rate": 4.5,
                    "fixed_term_years": 5,
                    "interim_rates": [6.0],
                },
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    two_year = data["results"][0]["schedule"]
    five_year = data["results"][1]["schedule"]

    # 2-year fix: fixed(4%) → interim(6%) → long-term(5%)
    assert two_year[0]["annual_rate"] == 4.0      # month 1: fixed
    assert two_year[23]["annual_rate"] == 4.0      # month 24: last fixed
    assert two_year[24]["annual_rate"] == 6.0      # month 25: interim
    assert two_year[59]["annual_rate"] == 6.0      # month 60: last interim
    assert two_year[60]["annual_rate"] == 5.0      # month 61: long-term

    # 5-year fix: fixed(4.5%) → long-term(5%) (no interim period)
    assert five_year[0]["annual_rate"] == 4.5      # month 1: fixed
    assert five_year[59]["annual_rate"] == 4.5     # month 60: last fixed
    assert five_year[60]["annual_rate"] == 5.0     # month 61: long-term
