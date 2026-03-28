import asyncio
import httpx
import json

async def test_endpoints():
    base_url = "http://localhost:8000"
    endpoints = [
        "/api/knowledge-graph/nodes",
        "/api/knowledge-graph/relationships?limit=60&min_strength=0",
        "/api/knowledge-graph/paths/Russia/EU?depth=5&max_paths=3",
        "/api/knowledge-graph/shacl-validation-summary",
        "/api/knowledge-graph/conflict-detection",
        "/api/knowledge-graph/centrality-stats",
        "/api/intelligence/alerts",
        "/api/intelligence/live-alerts"
    ]
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for ep in endpoints:
            try:
                resp = await client.get(f"{base_url}{ep}")
                print(f"Endpoint {ep}: STATUS {resp.status_code}")
                if resp.status_code != 200:
                    print(f"  ERROR: {resp.text}")
                else:
                    data = resp.json()
                    if "success" in data and not data["success"]:
                        print(f"  API ERROR: {data.get('error')}")
                    else:
                        print(f"  SUCCESS: {len(str(data))} bytes returned")
            except Exception as e:
                print(f"Endpoint {ep}: EXCEPTION {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
