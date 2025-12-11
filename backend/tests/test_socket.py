import pytest
import socketio
import requests
import time
import threading

# SocketIO client can be tricky in pytest if not handled carefully.
# We will keep using the synchronous Client for simplicity as it worked in the script.

def test_socket_connection_and_event(api_url):
    # Construct base URL for socket (remove /api/v1)
    # api_url is http://127.0.0.1:8000/api/v1
    base_url = api_url.replace("/api/v1", "")
    
    sio = socketio.Client()
    events_received = []
    
    @sio.on('connect', namespace='/ranking')
    def on_connect():
        pass

    @sio.on('ranking_update', namespace='/ranking')
    def on_update(data):
        events_received.append(data)
        sio.disconnect()

    # Worker to trigger update
    def trigger():
        time.sleep(2)
        # Create a user and post a record
        resp = requests.post(f"{api_url}/auth/signin", json={"name": "SocketTest", "phone": "010-9999-9999"})
        token = resp.json().get("accessToken")
        headers = {"Authorization": f"Bearer {token}"}
        requests.post(f"{api_url}/games/record", json={"clearTimeMs": 30000}, headers=headers)

    t = threading.Thread(target=trigger)
    t.start()
    
    try:
        sio.connect(base_url, namespaces=['/ranking'], transports=['polling'])
        # Wait up to 5 seconds
        sio.sleep(5)
    except Exception as e:
        pytest.fail(f"Socket connection failed: {e}")
    finally:
        t.join()
        if sio.connected:
            sio.disconnect()

    assert len(events_received) > 0, "Did not receive ranking_update event"
    assert isinstance(events_received[0], list), "Event data should be a list of rankings"
