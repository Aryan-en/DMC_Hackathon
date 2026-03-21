import requests

print("Geospatial Data Verification:\n")

# Test hotspots endpoint
r = requests.get('http://localhost:8000/api/geospatial/hotspots')
hotspots = r.json().get('data', [])
if hotspots:
    print(f"Hotspots found: {len(hotspots)}")
    if len(hotspots) > 0:
        hs = hotspots[0]
        print(f"  Sample: {hs.get('country')} at ({hs.get('latitude')}, {hs.get('longitude')})")

# Test heatmap endpoint
r = requests.get('http://localhost:8000/api/geospatial/heatmap')
heatmap = r.json().get('data', [])
if heatmap:
    print(f"\nHeatmap entries: {len(heatmap)}")
    if len(heatmap) > 0:
        he = heatmap[0]
        print(f"  Sample: {he.get('country')} - Risk: {he.get('risk_score')}")

print("\n✅ Geospatial data verification complete")
