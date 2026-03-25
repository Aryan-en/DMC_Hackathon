import json
import requests

base = 'http://127.0.0.1:8000'
eps = [
    '/health',
    '/api/health',
    '/api/metrics/regional-risk',
    '/api/intelligence/entity-extraction',
    '/api/knowledge-graph/nodes',
    '/api/geospatial/hotspots',
    '/api/predictions/conflict-risk',
    '/api/streams/topics',
    '/api/data-lake/summary',
    '/api/security/violations-trend',
    '/api/monitoring/performance',
]
out = {}
for ep in eps:
    try:
        r = requests.get(base + ep, timeout=10)
        b = r.json() if 'application/json' in r.headers.get('content-type', '') else {}
        out[ep] = {
            'code': r.status_code,
            'status': b.get('status') if isinstance(b, dict) else None,
            'source': ((b.get('meta') or {}).get('source') if isinstance(b, dict) else None),
        }
    except Exception as e:
        out[ep] = {'error': str(e)}
print(json.dumps(out, indent=2))
