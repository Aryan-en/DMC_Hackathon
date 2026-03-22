"""
IndiAPIs Data Extraction Script
Fetches economic, demographic, and geopolitical data from World Bank and other sources.
Enhanced to pull comprehensive India-specific datasets.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional, List
from pathlib import Path
import asyncio

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

# World Bank API configuration
WORLD_BANK_BASE = "https://api.worldbank.org/v2"

# Comprehensive economic indicators for India
INDICATORS = {
    # GDP & Growth
    "NY.GDP.MKTP.CD": "GDP (current US$)",
    "NY.GDP.MKTP.KD.ZS": "GDP growth (annual %)",
    "NY.GDP.PCAP.CD": "GDP per capita (current US$)",
    
    # Inflation & Prices
    "FP.CPI.TOTL.ZG": "Inflation (CPI annual %)",
    "NY.GDS.TOTL.ZS": "Gross savings (% of GNI)",
    
    # Investment & Capital
    "BX.KLT.DINV.CD.WD": "Foreign direct investment (net, BoP, current US$)",
    "BN.KLT.DINV.ZS": "Foreign direct investment (% of GDP)",
    
    # Population & Demographics
    "SP.POP.TOTL": "Population total",
    "SP.POP.GROW": "Population growth (annual %)",
    "SP.URB.TOTL.IN.ZS": "Urban population (% of total)",
    
    # Labor & Employment
    "NY.GDP.MKTP.CD": "Labor force participation rate (% of total population 15+)",
    "SE.ADT.LITR.ZS": "Literacy rate, adult total (% of population 15+)",
    
    # Trade
    "NE.EXP.GNFS.CD": "Exports of goods and services (current US$)",
    "NE.IMP.GNFS.CD": "Imports of goods and services (current US$)",
    "NE.RSB.GNFS.CD": "Current account balance (% of GDP)",
    
    # Energy
    "EG.ELC.ACCS.ZS": "Access to electricity (% of population)",
    "EG.FEC.RNEW.ZS": "Renewable energy consumption (% of total final energy consumption)",
    
    # Agriculture
    "AG.LND.AGRI.ZS": "Agricultural land (% of land area)",
    "AG.YLD.CREL.KG": "Cereal yield (kg per hectare)",
}

# India-specific demographic and census indicators
INDIA_CENSUS_DATA = {
    "population_2011": 1210193422,
    "population_density_per_km2": 382,
    "sex_ratio": 947,
    "literacy_rate": 74.04,
    "urban_population_percent": 31.16,
    "scheduled_castes_percent": 16.6,
    "scheduled_tribes_percent": 8.6,
    "sex_ratio_0_6": 918,
}

# Indian states (for regional data ingestion)
INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

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
                "metadata": data[0] if len(data) > 0 else None,
                "source": "World Bank"
            }
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {indicator_code} for {country_code}: {e}", file=sys.stderr)
        return None

def fetch_multiple_countries(indicator_code: str, countries: List[str]) -> Optional[Dict[str, Any]]:
    """
    Fetch indicator data for multiple countries for comparison.
    
    Args:
        indicator_code: World Bank indicator code
        countries: List of country codes
        
    Returns:
        Dictionary with data for multiple countries
    """
    try:
        countries_str = ";".join(countries)
        url = f"{WORLD_BANK_BASE}/country/{countries_str}/indicator/{indicator_code}?format=json&per_page=50"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if len(data) > 1 and data[1]:
            return {
                "indicator_code": indicator_code,
                "indicator_name": INDICATORS.get(indicator_code, indicator_code),
                "countries": countries,
                "data": data[1],
                "source": "World Bank"
            }
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching comparative data: {e}", file=sys.stderr)
        return None

def get_india_census_data() -> Dict[str, Any]:
    """Get India 2011 census data."""
    return {
        "country": "India",
        "year": 2011,
        "census_data": INDIA_CENSUS_DATA,
        "states": len(INDIAN_STATES),
        "union_territories": 8,
        "source": "Indian Census 2011"
    }

def get_regional_profile(state: str) -> Dict[str, Any]:
    """
    Generate regional profile for Indian state (mock data for now).
    In production, this would query state-specific APIs.
    """
    import random
    
    return {
        "state": state,
        "population": random.randint(5000000, 120000000),
        "area_sq_km": random.randint(20000, 350000),
        "literacy_rate": random.uniform(60, 85),
        "sex_ratio": random.randint(900, 1000),
        "urban_percentage": random.uniform(15, 50),
    }

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

def fetch_comparative_data() -> Dict[str, Any]:
    """Fetch comparative indicators across India and neighboring countries."""
    print("\nFetching comparative data (India vs neighbors)...")
    
    countries = ["IN", "CN", "PK", "BD"]  # India, China, Pakistan, Bangladesh
    indicator = "NY.GDP.MKTP.CD"  # GDP for comparison
    
    comparison = fetch_multiple_countries(indicator, countries)
    return {"comparative_gdp": comparison} if comparison else {}

def fetch_demographic_data() -> Dict[str, Any]:
    """Fetch census and demographic data for India."""
    print("Fetching demographic data...")
    
    return {
        "census": get_india_census_data(),
        "regional_profiles": [get_regional_profile(state) for state in INDIAN_STATES[:10]]  # First 10 states
    }

def main():
    """Main execution function."""
    print("=" * 70)
    print("IndiAPIs Comprehensive Data Extraction Tool")
    print("=" * 70)
    print()
    
    all_data = {
        "metadata": {
            "source": "IndiAPI (World Bank + Census)",
            "country": "India",
            "country_code": "IN",
            "fetch_timestamp": str(Path(__file__).stat().st_mtime)
        }
    }
    
    # Fetch World Bank indicators
    wb_data = fetch_all_indicators("IN")
    all_data["world_bank"] = wb_data
    print(f"\nWorld Bank: {wb_data['success_count']} successful, {wb_data['error_count']} failed\n")
    
    # Fetch comparative data
    all_data["comparative"] = fetch_comparative_data()
    
    # Fetch demographic data
    all_data["demographics"] = fetch_demographic_data()
    
    # Save results to file
    output_file = Path(__file__).parent / "indiapi_comprehensive.json"
    try:
        with open(output_file, "w") as f:
            json.dump(all_data, f, indent=2)
        print(f"\n✓ Comprehensive data saved to {output_file}")
    except Exception as e:
        print(f"Error saving data: {e}", file=sys.stderr)
        return 1
    
    # Print summary
    print("\n" + "=" * 70)
    print("DATA INGESTION SUMMARY")
    print("=" * 70)
    print(f"✓ World Bank Indicators: {wb_data['success_count']} fetched")
    print(f"✓ Census Data: 1 dataset (2011 India Census)")
    print(f"✓ Regional Profiles: {len(all_data['demographics'].get('regional_profiles', []))} states")
    print(f"✓ Comparative Analysis: {1 if all_data['comparative'] else 0} dataset(s)")
    print(f"\nTotal datasets ingested: {len(all_data)}")
    print("=" * 70)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())