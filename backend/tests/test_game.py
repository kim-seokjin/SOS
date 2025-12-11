import requests

def test_game_record_invalid_time(api_url, auth_header):
    # Try recording < 2000ms
    record_url = f"{api_url}/games/record"
    resp = requests.post(record_url, json={"clearTimeMs": 1500}, headers=auth_header)
    assert resp.status_code == 400, "Should reject impossible clear times"

def test_game_record_success_and_rank(api_url, auth_header):
    record_url = f"{api_url}/games/record"
    clear_time = 45200
    
    # 1. Post Record
    resp = requests.post(record_url, json={"clearTimeMs": clear_time}, headers=auth_header)
    assert resp.status_code in [200, 201]
    data = resp.json()
    assert data["success"] is True
    assert "rank" in data
    
    # 2. Verify My Rank
    rank_url = f"{api_url}/ranks/my"
    resp = requests.get(rank_url, headers=auth_header)
    assert resp.status_code == 200
    my_data = resp.json()
    assert my_data["rank"] == data["rank"]
    # expected string format "45.20" depending on logic
    assert my_data["record"] == "45.20"

def test_game_record_update_better_score(api_url, auth_header):
    record_url = f"{api_url}/games/record"
    
    # Initial score: 50s
    requests.post(record_url, json={"clearTimeMs": 50000}, headers=auth_header)
    
    # Better score: 35s
    resp = requests.post(record_url, json={"clearTimeMs": 35000}, headers=auth_header)
    assert resp.status_code in [200, 201]
    
    # Verify update
    rank_url = f"{api_url}/ranks/my"
    resp = requests.get(rank_url, headers=auth_header)
    data = resp.json()
    assert data["record"] == "35.00"

def test_game_record_ignore_worse_score(api_url, auth_header):
    record_url = f"{api_url}/games/record"
    
    # Best score: 30s
    requests.post(record_url, json={"clearTimeMs": 30000}, headers=auth_header)
    
    # Worse score: 60s
    requests.post(record_url, json={"clearTimeMs": 60000}, headers=auth_header)
    
    # Verify best is still 30s
    rank_url = f"{api_url}/ranks/my"
    resp = requests.get(rank_url, headers=auth_header)
    data = resp.json()
    assert data["record"] == "30.00"
