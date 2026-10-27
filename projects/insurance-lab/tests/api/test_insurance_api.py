import os
import uuid
from decimal import Decimal

import pytest
import requests

BASE_URL = os.getenv("INSURANCE_API_BASE_URL", "http://localhost:5080").rstrip("/")
TIMEOUT = 8


def unique_key(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex}"


def create_application(age: int = 30, premium: str = "1250.00") -> requests.Response:
    return requests.post(
        f"{BASE_URL}/api/applications",
        json={
            "applicantName": f"QA-{uuid.uuid4().hex[:8]}",
            "age": age,
            "productCode": "LIFE-BASIC",
            "premium": float(Decimal(premium)),
        },
        timeout=TIMEOUT,
    )


def test_health_endpoint():
    response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.parametrize("age", [17, 61, 0, 120])
def test_application_rejects_age_outside_practice_range(age):
    response = create_application(age=age)
    assert response.status_code == 400


@pytest.mark.parametrize("premium", ["0", "-1", "0.001"])
def test_application_rejects_invalid_premium(premium):
    response = create_application(premium=premium)
    assert response.status_code == 400


def test_approved_application_payment_issues_one_policy():
    created = create_application()
    assert created.status_code == 201, created.text
    application_id = created.json()["id"]

    underwriting = requests.post(
        f"{BASE_URL}/api/applications/{application_id}/underwrite",
        json={"approve": True, "note": "pytest integration test"},
        timeout=TIMEOUT,
    )
    assert underwriting.status_code == 200, underwriting.text
    assert underwriting.json()["status"] == "Approved"

    key = unique_key(f"pytest-app-{application_id}")
    paid = requests.post(
        f"{BASE_URL}/api/applications/{application_id}/pay",
        json={"idempotencyKey": key},
        timeout=TIMEOUT,
    )
    assert paid.status_code == 200, paid.text
    result = paid.json()
    assert result["policyStatus"] == "Active"
    assert result["policyNumber"]

    policies = requests.get(f"{BASE_URL}/api/policies", timeout=TIMEOUT)
    assert policies.status_code == 200
    matches = [p for p in policies.json() if p["applicationId"] == application_id]
    assert len(matches) == 1


def test_pending_application_cannot_be_paid():
    created = create_application()
    assert created.status_code == 201, created.text
    application_id = created.json()["id"]
    response = requests.post(
        f"{BASE_URL}/api/applications/{application_id}/pay",
        json={"idempotencyKey": unique_key("pending")},
        timeout=TIMEOUT,
    )
    assert response.status_code == 409


def test_rejected_application_cannot_be_paid():
    created = create_application()
    assert created.status_code == 201, created.text
    application_id = created.json()["id"]
    denied = requests.post(
        f"{BASE_URL}/api/applications/{application_id}/underwrite",
        json={"approve": False, "note": "test rejection"},
        timeout=TIMEOUT,
    )
    assert denied.status_code == 200
    paid = requests.post(
        f"{BASE_URL}/api/applications/{application_id}/pay",
        json={"idempotencyKey": unique_key("rejected")},
        timeout=TIMEOUT,
    )
    assert paid.status_code == 409


def test_cannot_underwrite_twice():
    created = create_application()
    assert created.status_code == 201, created.text
    application_id = created.json()["id"]
    first = requests.post(f"{BASE_URL}/api/applications/{application_id}/underwrite", json={"approve": True, "note": ""}, timeout=TIMEOUT)
    second = requests.post(f"{BASE_URL}/api/applications/{application_id}/underwrite", json={"approve": False, "note": ""}, timeout=TIMEOUT)
    assert first.status_code == 200
    assert second.status_code == 409

def test_repeated_payment_with_same_idempotency_key_is_safe():
    created = create_application()
    assert created.status_code == 201, created.text
    app_id = created.json()["id"]
    underwrite = requests.post(f"{BASE_URL}/api/applications/{app_id}/underwrite",
        json={"approve": True, "note": "idempotency test"}, timeout=TIMEOUT)
    assert underwrite.status_code == 200
    key = unique_key("same-key")
    first = requests.post(f"{BASE_URL}/api/applications/{app_id}/pay",
        json={"idempotencyKey": key}, timeout=TIMEOUT)
    second = requests.post(f"{BASE_URL}/api/applications/{app_id}/pay",
        json={"idempotencyKey": key}, timeout=TIMEOUT)
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert second.json()["duplicate"] is True
    assert first.json()["policyNumber"] == second.json()["policyNumber"]
    policies = requests.get(f"{BASE_URL}/api/policies", timeout=TIMEOUT)
    assert len([p for p in policies.json() if p["applicationId"] == app_id]) == 1
