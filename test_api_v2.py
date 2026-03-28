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
    
    results = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for ep in endpoints:
            try:
                resp = await client.get(f"{base_url}{ep}")
                status = resp.status_code
                try:
                    data = resp.json()
                    success = data.get("success", True)
                    error = data.get("error")
                except:
                    data = resp.text[:100]
                    success = False
                    error = "Invalid JSON"
                
                results.append({
                    "endpoint": ep,
                    "status": status,
                    "success": success,
                    "error": error,
                    "data_size": len(str(data))
                })
            except Exception as e:
                results.append({
                    "endpoint": ep,
                    "error": str(e)
                })
    
    with open("endpoint_results.txt", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(test_endpoints())
