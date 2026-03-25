import urllib.request
import json
import ssl

endpoints = [
    "/api/geospatial/hotspots",
    "/api/geospatial/climate-indicators",
    "/api/geospatial/incidents/global",
    "/api/geospatial/economic-activity",
    "/api/streams/topics",
    "/api/streams/pipelines",
    "/api/metrics/regional-risk",
    "/api/metrics/global-entities",
    "/api/metrics/threat-threads",
    "/api/metrics/daily-ingestion",
    "/api/metrics/prediction-accuracy",
    "/api/metrics/infrastructure-health",
    "/api/security/monitoring-dashboard",
    "/api/security/audit-log?limit=50",
    "/api/security/violations-trend",
    "/api/intelligence/processing-log",
    "/api/intelligence/entity-extraction",
    "/api/intelligence/language-distribution",
    "/api/intelligence/trending-keywords",
    "/api/intelligence/sentiment-radar",
    "/api/intelligence/strategic-briefs",
    "/api/intelligence/pipeline-status",
    "/api/predictions/conflict-risk",
    "/api/predictions/model-performance",
    "/api/predictions/model-drift",
    "/api/predictions/training-status",
    "/api/predictions/serving-health",
    "/api/predictions/dashboard-overview",
    "/api/predictions/pyg-model/status",
    "/api/predictions/ab-testing/summary",
    "/api/knowledge-graph/nodes",
    "/api/knowledge-graph/shacl-validation-summary",
    "/api/knowledge-graph/conflict-detection",
    "/api/knowledge-graph/centrality-stats",
    "/api/data-lake/summary",
    "/api/data-lake/datasets"
]

base_url = "http://localhost:8000"
failed = []
success = []

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for ep in endpoints:
    url = base_url + ep
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, context=ctx, timeout=3) as resp:
            code = resp.getcode()
            if code == 200:
                success.append(ep)
            else:
                failed.append(f"{ep} (Code: {code})")
    except urllib.error.HTTPError as e:
        failed.append(f"{ep} (HTTP {e.code})")
    except Exception as e:
        failed.append(f"{ep} (Error: {str(e)})")

print(f"Total endpoints tested: {len(endpoints)}")
print(f"Successful: {len(success)}")
print(f"Failed: {len(failed)}")
if failed:
    print("\nFailed Endpoints:")
    for f in failed:
        print("-", f)
