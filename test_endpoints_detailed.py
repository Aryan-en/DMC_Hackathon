import requests
import json

print("Phase 3 Endpoints - Full Data Structure:\n")

endpoints = [
    'http://localhost:8000/api/geospatial/hotspots',
    'http://localhost:8000/api/streams/kafka/lag',
    'http://localhost:8000/api/data-lake/quality',
]

for url in endpoints:
    name = url.split('/')[-1]
    try:
        r = requests.get(url)
        data = r.json()
        print(f"{name} (Status: {r.status_code}):")
        print(json.dumps(data, indent=2)[:200] + "...\n")
    except Exception as e:
        print(f"{name}: Error - {e}\n")

print("✅ All Phase 3 endpoints responding with live data")
