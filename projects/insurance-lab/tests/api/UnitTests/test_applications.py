import requests
import pytest
import os

# BaseUrl
appBaseUrl = requests.get('http://localhost:5080/api/applications')
BASE_URL = os.getenv("INSURANCE_API_BASE_URL", "http://localhost:5080").rstrip("/")
appUrl = BASE_URL + "/api/applications"

# /api/applications
def func_GetApp1():
    getApp1Res = requests.get(appUrl)
    assert getApp1Res.status_code == 200