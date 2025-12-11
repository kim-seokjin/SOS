import pytest
import requests
import random
import string

BASE_URL = "http://127.0.0.1:8000/api/v1"

@pytest.fixture
def api_url():
    return BASE_URL

@pytest.fixture
def random_user():
    suffix = ''.join(random.choices(string.digits, k=4))
    return {
        "name": f"TestUser{suffix}",
        "phone": f"010-0000-{suffix}"
    }

@pytest.fixture
def auth_header(api_url, random_user):
    resp = requests.post(f"{api_url}/auth/signin", json=random_user)
    assert resp.status_code == 200
    token = resp.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}
