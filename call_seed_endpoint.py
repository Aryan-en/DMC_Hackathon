#!/usr/bin/env python3
"""Call the knowledge graph seed API endpoint"""
import requests
import json

try:
    print("🔄 Seeding knowledge graph data...")
    response = requests.post("http://localhost:8000/api/knowledge-graph/seed-data")
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        if 'data' in result:
            print(f"✅ {result['data']['message']}")
            print(f"  - Entities: {result['data']['entities']}")
            print(f"  - Relationships: {result['data']['relationships']}")
        else:
            print(f"✅ Response: {result}")
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Failed: {e}")
    import traceback
    traceback.print_exc()

