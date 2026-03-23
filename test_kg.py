#!/usr/bin/env python3
"""Test knowledge graph endpoint"""
import requests
import time
import sys

def test_kg_endpoint():
    """Test if knowledge graph is accessible"""
    max_retries = 8
    wait_seconds = 2
    
    print("\n[TEST] Knowledge Graph Endpoint")
    print(f"[INFO] Waiting for backend to start (max {max_retries*wait_seconds}s)...\n")
    
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[ATTEMPT {attempt}/{max_retries}] Connecting to http://localhost:8000/api/knowledge-graph/nodes")
            response = requests.get(
                'http://localhost:8000/api/knowledge-graph/nodes',
                timeout=3
            )
            
            print(f"[OK] Backend responded with status {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[OK] Response received")
                print(f"[DATA] Response keys: {list(data.keys())}")
                
                if 'data' in data:
                    nodes = data['data']
                    if isinstance(nodes, list):
                        print(f"[DATA] Total nodes: {len(nodes)}")
                        if nodes:
                            print(f"[DATA] Sample node: {nodes[0]}")
                elif 'nodes' in data:
                    print(f"[DATA] Nodes: {len(data['nodes'])}")
                
                print("\n[SUCCESS] Knowledge graph is accessible!")
                return True
            else:
                print(f"[WARN] Unexpected status code: {response.status_code}")
                print(f"[DEBUG] Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError as e:
            print(f"[WAIT] Connection refused - backend still starting...")
            if attempt < max_retries:
                time.sleep(wait_seconds)
        except requests.exceptions.Timeout:
            print(f"[WAIT] Request timeout - backend still initializing...")
            if attempt < max_retries:
                time.sleep(wait_seconds)
        except Exception as e:
            print(f"[ERROR] {type(e).__name__}: {e}")
            if attempt < max_retries:
                time.sleep(wait_seconds)
    
    print("\n[FAILED] Backend did not respond after all retries")
    return False

if __name__ == "__main__":
    success = test_kg_endpoint()
    sys.exit(0 if success else 1)
