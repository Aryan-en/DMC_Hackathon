import time
import requests
import json

time.sleep(3)

print("Testing Phase 3 Endpoints:\n")

endpoints = [
    ('Kafka Lag', 'http://localhost:8000/api/streams/kafka/lag'),
    ('Data Quality', 'http://localhost:8000/api/data-lake/quality'),
    ('Geospatial Heatmap', 'http://localhost:8000/api/geospatial/heatmap'),
    ('Flink Clusters', 'http://localhost:8000/api/streams/flink/clusters'),
]

for name, url in endpoints:
    try:
        r = requests.get(url, timeout=3)
        print(f"✓ {name}: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if 'data' in data:
                print(f"  Data count: {len(data.get('data', []))}")
    except Exception as e:
        print(f"✗ {name}: {str(e)[:40]}")

print("\n✅ Phase 3 endpoints verification complete")
