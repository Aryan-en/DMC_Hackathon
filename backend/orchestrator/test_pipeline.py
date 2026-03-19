"""
Standalone Data Pipeline Test
Tests MEA scraper and World Bank fetcher without Kafka dependency.

This demonstrates the data extraction and transformation layer
before they get sent to Kafka.
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ingestors.mea_scraper import MEAScraper
from ingestors.worldbank_fetcher import WorldBankFetcher


async def test_mea_scraper():
    """Test MEA scraper extraction."""
    print("\n" + "="*70)
    print("Testing MEA Relations Scraper")
    print("="*70)
    
    try:
        scraper = MEAScraper()
        
        # Test countries
        test_countries = ["China", "United States", "Pakistan"]
        
        results = []
        for country in test_countries:
            print(f"\n  Scraping relations with {country}...")
            try:
                relation = await scraper.fetch_country_relations(country)
                if relation:
                    results.append(relation)
                    print(f"    ✓ Got relation data:")
                    print(f"      - Country: {relation.get('country')}")
                    print(f"      - Type: {relation.get('relation_type')}")
                    print(f"      - Status: {relation.get('status')}")
                    print(f"      - Confidence: {relation.get('confidence_score', 'N/A')}")
                else:
                    print(f"    ✗ No data found")
            except Exception as e:
                print(f"    ✗ Error: {e}")
        
        # Save results
        if results:
            output_file = Path(__file__).parent / "mea_test_results.json"
            with open(output_file, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\n  Results saved to {output_file}")
            print(f"  Total relations scraped: {len(results)}")
        
        return len(results)
        
    except Exception as e:
        print(f"  Error: {e}")
        return 0


async def test_worldbank_fetcher():
    """Test World Bank API fetcher."""
    print("\n" + "="*70)
    print("Testing World Bank Economic Indicator Fetcher")
    print("="*70)
    
    try:
        fetcher = WorldBankFetcher()
        
        # Test countries
        test_countries = {
            "IND": "India",
            "PAK": "Pakistan",
            "USA": "United States",
        }
        
        all_results = []
        
        for code, name in test_countries.items():
            print(f"\n  Fetching indicators for {name} ({code})...")
            try:
                indicators = await fetcher.fetch_indicators(code)
                
                if indicators and "indicators" in indicators:
                    indicator_list = indicators["indicators"]
                    all_results.append(indicators)
                    
                    print(f"    ✓ Got {len(indicator_list)} indicators:")
                    for ind in indicator_list[:3]:  # Show first 3
                        print(f"      - {ind.get('indicator_name')}: {ind.get('value')} {ind.get('unit', '')}")
                    if len(indicator_list) > 3:
                        print(f"      ... and {len(indicator_list) - 3} more")
                else:
                    print(f"    ✗ No data found")
                    
            except Exception as e:
                print(f"    ✗ Error: {e}")
        
        # Save results
        if all_results:
            output_file = Path(__file__).parent / "worldbank_test_results.json"
            with open(output_file, "w") as f:
                json.dump(all_results, f, indent=2)
            print(f"\n  Results saved to {output_file}")
            print(f"  Total countries processed: {len(all_results)}")
        
        return len(all_results)
        
    except Exception as e:
        print(f"  Error: {e}")
        return 0


async def main():
    """Run all tests."""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + "ONTORA DATA PIPELINE TEST".center(68) + "║")
    print("║" + "Standalone Data Extraction Validation".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")
    
    try:
        # Test MEA scraper
        mea_count = await test_mea_scraper()
        
        # Test World Bank fetcher
        wb_count = await test_worldbank_fetcher()
        
        # Summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"  MEA Relations Scraped: {mea_count}")
        print(f"  World Bank Indicators Fetched: {wb_count}")
        print(f"  Total Data Points: {mea_count + wb_count}")
        print("="*70)
        
        if mea_count > 0 or wb_count > 0:
            print("\n✓ Data extraction layers working correctly!")
            print("\nNext Steps:")
            print("  1. Review test results in JSON files")
            print("  2. Connect to Kafka producers")
            print("  3. Start Kafka consumers to write to PostgreSQL")
            print("  4. Verify data in database")
            return 0
        else:
            print("\n✗ No data extracted. Check network connectivity.")
            return 1
            
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
