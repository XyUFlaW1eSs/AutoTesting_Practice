import os

import pytest
import requests

from tests.utils.json_loader import load_json, get_test_case

BASE_URL = os.getenv(
    "INSURANCE_API_BASE_URL",
    "http://localhost:5080"
).rstrip("/")

APP_URL = f"{BASE_URL}/api/applications"
DATA_URL = "tests/api/UnitTests/testdata/data_applications.json"
TIMEOUT = 8

TEST_DATA = load_json(DATA_URL)

@pytest.mark.parametrize(
    "case_id, expected_status",
    [
        ("UT-APP-001", 201),
        ("UT-APP-002-01", 400),
        ("UT-APP-002-02", 400),
        ("UT-APP-002-03", 400),
    ],
    ids=[
        "valid-applicant-name",
        "null-applicant-name",
        "empty-applicant-name",
        "whitespace-applicant-name",
    ]
)
def test_create_application(case_id, expected_status):
    payload = get_test_case(TEST_DATA, case_id)
    # 发起 POST 请求
    response = requests.post(
        APP_URL,
        json=payload,
        timeout=TIMEOUT
    )

    # 验证 HTTP 状态码
    assert response.status_code == expected_status