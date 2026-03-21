import requests
import json

endpoints = [
    '/api/metrics/regional-risk',
    '/api/metrics/global-entities',
    '/api/knowledge-graph/nodes',
    '/api/predictions/conflict-risk',
    '/api/analytics/metrics',
]

for ep in endpoints:
    try:
        r = requests.get(f'http://127.0.0.1:8000{ep}', timeout=5)
        data = r.json()
        
        # Check if it has data
        data_field = data.get('data', {})
        if isinstance(data_field, dict):
            data_keys = list(data_field.keys())
            print(f'{ep}:')
            print(f'  Status: {r.status_code}')
            print(f'  Data keys: {data_keys}')
            if 'regions' in data_field and data_field['regions']:
                print(f'  Regions count: {len(data_field["regions"])}')
            elif 'entities' in data_field and data_field['entities']:
                print(f'  Entities count: {len(data_field["entities"])}')
            elif 'nodes' in data_field and data_field['nodes']:
                print(f'  Nodes count: {len(data_field["nodes"])}')
            else:
                print(f'  Has data: {bool(data_field)}')
        elif isinstance(data_field, list):
            print(f'{ep}:')
            print(f'  Status: {r.status_code}')
            print(f'  Items: {len(data_field)}')
    except Exception as e:
        print(f'{ep}: ERROR - {e}')
