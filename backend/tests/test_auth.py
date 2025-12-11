import requests

def test_signin_success(api_url, random_user):
    resp = requests.post(f"{api_url}/auth/signin", json=random_user)
    assert resp.status_code == 200
    data = resp.json()
    assert "accessToken" in data
    assert data["user"]["name"] == random_user["name"]
    # Phone is not returned in UserResponse for privacy/schema reasons
    assert "id" in data["user"]
