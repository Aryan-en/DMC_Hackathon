import requests
import json

BASE_URL = "http://localhost:8000/api"

endpoints = [
    "/intelligence/alerts",
    "/metrics/sentiment-trend",
    "/metrics/entity-distribution",
    "/predictions/conflict-risk",
    "/tasks/telemetry/live"
]

def test_endpoints():
    print(f"Verifying Ontora API Endpoints at {BASE_URL}...")
    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                print(f"[OK] {endpoint} - Status: {status}")
            else:
                print(f"[FAIL] {endpoint} - HTTP {response.status_code}")
        except Exception as e:
            print(f"[ERROR] {endpoint} - {str(e)}")

if __name__ == "__main__":
    test_endpoints()
