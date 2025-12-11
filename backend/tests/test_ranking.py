import requests

def create_user_with_score(api_url, name, phone, score_ms):
    resp = requests.post(f"{api_url}/auth/signin", json={"name": name, "phone": phone})
    assert resp.status_code == 200
    token = resp.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    requests.post(f"{api_url}/games/record", json={"clearTimeMs": score_ms}, headers=headers)
    return token

def test_ranking_order_and_masking(api_url):
    # Create unique users for this test to avoid collision with DB state
    # We use a suffix to ensure uniqueness
    import random
    suffix = str(random.randint(1000, 9999))
    
    # User A: 50s
    # User B: 40s (Best)
    # User C: 45s
    
    user_a = f"Alpha{suffix}"
    user_b = f"Beta{suffix}"
    user_c = f"Charlie{suffix}"
    
    create_user_with_score(api_url, user_a, f"010-1111-{suffix}", 50000)
    create_user_with_score(api_url, user_b, f"010-2222-{suffix}", 40000)
    create_user_with_score(api_url, user_c, f"010-3333-{suffix}", 45000)
    
    resp = requests.get(f"{api_url}/ranks?limit=50") # fetch enough to find them
    assert resp.status_code == 200
    ranks = resp.json()
    
    # Find our users
    # Records: 40.00, 45.00, 50.00
    
    # Filter by record AND masked name to identify them uniquely-ish
    # Or just search for the specific unique records if likely unique
    
    # Masking check
    # Alpha1234 -> A*******4
    def mask_check(name):
        if len(name) <= 2: return name[0] + "*"
        return name[0] + "*" * (len(name) - 2) + name[-1]

    masked_a = mask_check(user_a)
    masked_b = mask_check(user_b)
    masked_c = mask_check(user_c)
    
    entry_a = next((r for r in ranks if r["name"] == masked_a and r["record"] == "50.00"), None)
    entry_b = next((r for r in ranks if r["name"] == masked_b and r["record"] == "40.00"), None)
    entry_c = next((r for r in ranks if r["name"] == masked_c and r["record"] == "45.00"), None)
    
    assert entry_a, "User A not found in rankings"
    assert entry_b, "User B not found in rankings"
    assert entry_c, "User C not found in rankings"
    
    # Check Order
    # Rank B < Rank C < Rank A
    assert entry_b["rank"] < entry_c["rank"] < entry_a["rank"], \
        f"Ranking order incorrect: {entry_b['rank']} < {entry_c['rank']} < {entry_a['rank']}"
