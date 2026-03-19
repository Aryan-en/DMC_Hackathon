"""
IndiAPIs Data Extraction Script
Fetches economic and geopolitical data from World Bank and other sources.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

# World Bank API configuration
WORLD_BANK_BASE = "https://api.worldbank.org/v2"

# Economic indicators to fetch for India
INDICATORS = {
    "NY.GDP.MKTP.CD": "GDP (current US$)",
    "NY.GDP.MKTP.KD.ZS": "GDP growth (annual %)",
    "FP.CPI.TOTL.ZG": "Inflation (CPI annual %)",
    "BX.KLT.DINV.CD.WD": "Foreign direct investment (net, BoP, current US$)",
    "SP.POP.TOTL": "Population total",
}

def fetch_world_bank_indicator(country_code: str, indicator_code: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single indicator from World Bank API.
    
    Args:
        country_code: ISO country code (e.g., 'IN' for India)
        indicator_code: World Bank indicator code
        
    Returns:
        Dictionary with indicator data or None if error
    """
    try:
        url = f"{WORLD_BANK_BASE}/country/{country_code}/indicator/{indicator_code}?format=json&per_page=50"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if len(data) > 1 and data[1]:  # Check if we got data
            return {
                "country_code": country_code,
                "indicator_code": indicator_code,
                "indicator_name": INDICATORS.get(indicator_code, indicator_code),
                "data": data[1],
                "metadata": data[0] if len(data) > 0 else None
            }
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {indicator_code} for {country_code}: {e}", file=sys.stderr)
        return None

def fetch_all_indicators(country_code: str = "IN") -> Dict[str, Any]:
    """
    Fetch all indicators for a country.
    
    Args:
        country_code: ISO country code
        
    Returns:
        Dictionary with all indicator results
    """
    results = {
        "country_code": country_code,
        "indicators": [],
        "success_count": 0,
        "error_count": 0
    }
    
    print(f"Fetching World Bank indicators for {country_code}...\n")
    
    for indicator_code, indicator_name in INDICATORS.items():
        print(f"  Fetching {indicator_name}...", end=" ")
        data = fetch_world_bank_indicator(country_code, indicator_code)
        
        if data:
            results["indicators"].append(data)
            results["success_count"] += 1
            print("✓")
        else:
            results["error_count"] += 1
            print("✗")
    
    return results

def main():
    """Main execution function."""
    print("=" * 70)
    print("IndiAPIs Data Extraction Tool")
    print("=" * 70)
    print()
    
    # Fetch World Bank data for India
    wb_data = fetch_all_indicators("IN")
    
    print(f"\nResults: {wb_data['success_count']} successful, {wb_data['error_count']} failed\n")
    
    # Save results to file
    output_file = Path(__file__).parent / "world_bank_data.json"
    try:
        with open(output_file, "w") as f:
            json.dump(wb_data, f, indent=2)
        print(f"Data saved to {output_file}")
    except Exception as e:
        print(f"Error saving data: {e}", file=sys.stderr)
        return 1
    
    # Print summary
    if wb_data["indicators"]:
        print("\nFetched Indicators:")
        for indicator in wb_data["indicators"]:
            print(f"  - {indicator['indicator_name']}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())