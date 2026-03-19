"""World Bank API Data Fetcher - Data Ingestion"""

import logging
from datetime import datetime
from typing import List, Dict, Optional
import requests
from config import settings

logger = logging.getLogger(__name__)


class WorldBankFetcher:
    """Fetcher for World Bank economic indicators"""
    
    def __init__(self):
        self.base_url = settings.WORLDBANK_API_BASE
        self.timeout = 30
        
        # Key indicators to fetch
        self.indicators = {
            'NY.GDP.MKTP.CD': 'GDP (current US$)',
            'NY.GDP.MKTP.KD.ZG': 'GDP growth (annual %)',
            'FP.CPI.TOTL.ZG': 'Inflation, consumer prices (annual %)',
            'BX.KLT.DINV.CD.WD': 'Foreign direct investment, net',
            'SP.POP.TOTL': 'Population, total',
            'SP.URB.TOTL': 'Urban population',
            'SP.DYN.LE00.IN': 'Life expectancy at birth',
            'SL.UEM.TOTL.ZS': 'Unemployment, total (% of labor force)',
        }
    
    async def fetch_indicators(self, country_code: str = 'IND') -> List[Dict]:
        """
        Fetch economic indicators for a country
        
        Args:
            country_code: ISO country code (default: India)
            
        Returns:
            List of indicator records
        """
        indicators = []
        
        for indicator_code, indicator_name in self.indicators.items():
            try:
                data = await self._fetch_indicator(country_code, indicator_code, indicator_name)
                indicators.extend(data)
            except Exception as e:
                logger.error(f"Error fetching {indicator_code}: {e}")
                continue
        
        logger.info(f"Successfully fetched {len(indicators)} indicators for {country_code}")
        return indicators
    
    async def _fetch_indicator(self, country_code: str, indicator_code: str, indicator_name: str) -> List[Dict]:
        """
        Fetch specific indicator data
        
        Args:
            country_code: ISO country code
            indicator_code: World Bank indicator code
            indicator_name: Human-readable indicator name
            
        Returns:
            List of records for this indicator
        """
        records = []
        
        try:
            url = f"{self.base_url}/country/{country_code}/indicator/{indicator_code}"
            params = {
                'format': 'json',
                'per_page': '100',
                'mrnev': ''  # Most recent non-empty value
            }
            
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if len(data) < 2 or not data[1]:
                logger.debug(f"No data returned for {indicator_code}")
                return records
            
            # Extract data points
            for record in data[1]:
                if record['value'] is not None:
                    records.append({
                        "country_code": country_code,
                        "indicator_code": indicator_code,
                        "indicator_name": indicator_name,
                        "value": float(record['value']),
                        "year": int(record['date']),
                        "unit": self._get_unit_for_indicator(indicator_code),
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "World Bank"
                    })
            
            logger.debug(f"Fetched {len(records)} records for {indicator_code}")
            return records
            
        except requests.RequestException as e:
            logger.error(f"API error for {indicator_code}: {e}")
            return []
        except (ValueError, KeyError) as e:
            logger.error(f"Data parsing error for {indicator_code}: {e}")
            return []
    
    def _get_unit_for_indicator(self, indicator_code: str) -> str:
        """Get unit of measurement for indicator"""
        unit_map = {
            'NY.GDP.MKTP.CD': 'USD',
            'NY.GDP.MKTP.KD.ZG': '%',
            'FP.CPI.TOTL.ZG': '%',
            'BX.KLT.DINV.CD.WD': 'USD',
            'SP.POP.TOTL': 'persons',
            'SP.URB.TOTL': 'persons',
            'SP.DYN.LE00.IN': 'years',
            'SL.UEM.TOTL.ZS': '%',
        }
        return unit_map.get(indicator_code, 'unknown')
    
    async def fetch_all_countries(self) -> List[Dict]:
        """Fetch indicators for all countries"""
        all_indicators = []
        
        try:
            # Get list of all countries
            url = f"{self.base_url}/country"
            params = {'format': 'json', 'per_page': 500}
            
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            countries = data[1] if len(data) > 1 else []
            
            logger.info(f"Fetching indicators for {len(countries)} countries")
            
            for country in countries[:10]:  # Limit to first 10 for now
                country_code = country['id']
                indicators = await self.fetch_indicators(country_code)
                all_indicators.extend(indicators)
            
            return all_indicators
            
        except Exception as e:
            logger.error(f"Error fetching all countries: {e}")
            return []


async def run_worldbank_fetcher(country_code: str = 'IND'):
    """Execute World Bank fetching job"""
    fetcher = WorldBankFetcher()
    indicators = await fetcher.fetch_indicators(country_code)
    
    # TODO: Save to PostgreSQL and Kafka
    logger.info(f"Extracted {len(indicators)} economic indicators")
    return indicators
