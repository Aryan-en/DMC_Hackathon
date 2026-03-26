#!/usr/bin/env python
"""Quick test script for the new node-details endpoint."""

import asyncio
import httpx

async def test_node_details():
    """Test the GET /api/knowledge-graph/node-details endpoint."""
    base_url = "http://127.0.0.1:8000"
    
    # Test with Russia (should exist in seeded data)
    test_cases = [
        ("Russia", "Should find Russia entity"),
        ("USA", "Should find USA entity"),
        ("InvalidNode12345", "Should return 404 for non-existent entity"),
    ]
    
    async with httpx.AsyncClient() as client:
        for entity_name, description in test_cases:
            print(f"\n{'='*60}")
            print(f"Testing: {entity_name}")
            print(f"Description: {description}")
            print('='*60)
            
            try:
                url = f"{base_url}/api/knowledge-graph/node-details?name={entity_name}"
                response = await client.get(url, timeout=10)
                
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        entity_data = data.get('data', {}).get('entity', {})
                        metrics = data.get('data', {}).get('metrics', {})
                        risk = data.get('data', {}).get('risk', {})
                        rels = data.get('data', {}).get('relationships', {})
                        
                        print(f"\n✓ Entity: {entity_data.get('name')}")
                        print(f"  Type: {entity_data.get('type')}")
                        print(f"  Description: {entity_data.get('description', 'N/A')[:80]}...")
                        print(f"  Confidence: {entity_data.get('confidence')}")
                        print(f"\n  Metrics:")
                        print(f"    - Degree: {metrics.get('degree')}")
                        print(f"    - Incoming: {metrics.get('incoming_connections')}")
                        print(f"    - Outgoing: {metrics.get('outgoing_connections')}")
                        print(f"    - Avg Strength: {metrics.get('avg_strength')}%")
                        print(f"    - Centrality: {metrics.get('centrality')}")
                        print(f"    - Rank: {metrics.get('node_rank', 'N/A')}")
                        
                        print(f"\n  Risk Analysis:")
                        print(f"    - Risk Edge Count: {risk.get('risk_edge_count')}")
                        print(f"    - Hotspot Hits: {risk.get('hotspot_hits')}")
                        print(f"    - Risk Edges (top): {len(risk.get('risk_edges', []))}")
                        
                        print(f"\n  Relationships:")
                        print(f"    - Total: {len(rels.get('all', []))}")
                        print(f"    - Incoming: {len(rels.get('incoming', []))}")
                        print(f"    - Outgoing: {len(rels.get('outgoing', []))}")
                    else:
                        print(f"✗ API Error: {data.get('error', {}).get('message')}")
                else:
                    print(f"✗ Got status {response.status_code}")
                    print(f"Response: {response.text[:200]}")
            except Exception as e:
                print(f"✗ Exception: {e}")

if __name__ == "__main__":
    print("Starting backend endpoint test...")
    print("Make sure the backend is running at http://127.0.0.1:8000")
    asyncio.run(test_node_details())
    print("\n✓ Test complete!")
