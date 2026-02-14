from fastapi.testclient import TestClient

from mortgage_api.main import app

client = TestClient(app)


def test_compare_basic():
    response = client.post(
        "/api/compare",
        json={
            "loan_amount": 200_000,
            "total_term_years": 25,
            "offers": [
                {
                    "label": "2-year fix",
                    "interest_rate": 4.0,
                    "fixed_term_years": 2,
                    "mortgage_type": "repayment",
                    "scenario_rate": 6.0,
                },
                {
                    "label": "5-year fix",
                    "interest_rate": 4.5,
                    "fixed_term_years": 5,
                    "mortgage_type": "repayment",
                    "scenario_rate": 6.0,
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
                    "scenario_rate": 5.0,
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
                    "scenario_rate": 5.5,
                }
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    # Interest-only: balance stays at loan amount
    assert data["results"][0]["schedule"][-1]["remaining_balance"] == 150_000.0
