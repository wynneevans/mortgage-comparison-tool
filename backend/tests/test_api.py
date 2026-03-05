from fastapi.testclient import TestClient

from mortgage_api.main import app

client = TestClient(app)


def test_compare_basic():
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 200_000,
            "total_term_years": 25,
            "future_rate": 5.0,
            "offers": [
                {
                    "label": "2-year fix",
                    "interest_rate": 4.0,
                    "fixed_term_years": 2,
                    "mortgage_type": "repayment",
                },
                {
                    "label": "5-year fix",
                    "interest_rate": 4.5,
                    "fixed_term_years": 5,
                    "mortgage_type": "repayment",
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
                }
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    # Interest-only: balance stays at loan amount
    assert data["results"][0]["schedule"][-1]["remaining_balance"] == 150_000.0


def test_compare_validation_bad_future_rate():
    """future_rate must be > 0 and <= 100."""
    for bad_rate in [-1.0, 101.0]:
        response = client.post(
            "/api/compare",
            json={
                "loan_amount": 200_000,
                "future_rate": bad_rate,
                "offers": [{"label": "Bad", "interest_rate": 4.0, "fixed_term_years": 2}],
            },
        )
        assert response.status_code == 422


def test_compare_two_period_rates():
    """After fixed period, all offers use the single future rate."""
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 200_000,
            "total_term_years": 25,
            "future_rate": 6.0,
            "offers": [
                {
                    "label": "2-year fix",
                    "interest_rate": 4.0,
                    "fixed_term_years": 2,
                },
                {
                    "label": "5-year fix",
                    "interest_rate": 4.5,
                    "fixed_term_years": 5,
                },
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    two_year = data["results"][0]["schedule"]
    five_year = data["results"][1]["schedule"]

    # 2-year fix: fixed(4%) → future(6%) from month 25
    assert two_year[0]["annual_rate"] == 4.0      # month 1: fixed
    assert two_year[23]["annual_rate"] == 4.0     # month 24: last fixed
    assert two_year[24]["annual_rate"] == 6.0     # month 25: future
    assert two_year[60]["annual_rate"] == 6.0     # month 61: future

    # 5-year fix: fixed(4.5%) → future(6%) from month 61
    assert five_year[0]["annual_rate"] == 4.5     # month 1: fixed
    assert five_year[59]["annual_rate"] == 4.5    # month 60: last fixed
    assert five_year[60]["annual_rate"] == 6.0    # month 61: future
