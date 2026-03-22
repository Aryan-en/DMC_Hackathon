"""
MEA Bilateral Relations PDF Data Seeding Script

Processes all 208 downloaded MEA bilateral relation PDFs and seeds them into
the database as Document records with CountryRelation metadata.

Usage: python seed_mea_data.py
"""

import asyncio
import json
import re
from pathlib import Path
from datetime import datetime
import sys
import uuid

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres import init_db
from db.schemas import Document, Country, CountryRelation
from config import settings

# MEA folder path
MEA_FOLDER = Path(__file__).parent / "data" / "MEA"

# Country code mapping (ISO 3-letter codes)
COUNTRY_ISO_MAPPING = {
    "Afghanistan": "AFG", "Albania": "ALB", "Algeria": "DZA", "Andorra": "AND",
    "Angola": "AGO", "Antigua": "ATG", "Argentina": "ARG", "Armenia": "ARM",
    "Australia": "AUS", "Austria": "AUT", "Azerbaijan": "AZE", "Bahamas": "BHS",
    "Bahrain": "BHR", "Bangladesh": "BGD", "Barbados": "BRB", "Belarus": "BLR",
    "Belgium": "BEL", "Belize": "BLZ", "Benin": "BEN", "Bhutan": "BTN",
    "Bolivia": "BOL", "Bosnia": "BIH", "Botswana": "BWA", "Brazil": "BRA",
    "Brunei": "BRN", "Bulgaria": "BGR", "Burkina": "BFA", "Burundi": "BDI",
    "Cabo": "CPV", "Cambodia": "KHM", "Cameroon": "CMR", "Canada": "CAN",
    "Cayman": "CYM", "Central": "CAF", "Chad": "TCD", "Chile": "CHL",
    "China": "CHN", "Colombia": "COL", "Comoros": "COM", "Congo": "COG",
    "Cook": "COK", "Costa": "CRI", "Cote": "CIV", "Croatia": "HRV",
    "Cuba": "CUB", "Cyprus": "CYP", "Czech": "CZE", "Denmark": "DNK",
    "Djibouti": "DJI", "Dominica": "DMA", "Dominican": "DOM", "Ecuador": "ECU",
    "Egypt": "EGY", "El": "SLV", "Equatorial": "GNQ", "Eritrea": "ERI",
    "Estonia": "EST", "Ethiopia": "ETH", "Fiji": "FJI", "Finland": "FIN",
    "France": "FRA", "Gabon": "GAB", "Gambia": "GMB", "Georgia": "GEO",
    "Germany": "DEU", "Ghana": "GHA", "Greece": "GRC", "Grenada": "GRD",
    "Guatemala": "GTM", "Guinea": "GIN", "Guyana": "GUY", "Haiti": "HTI",
    "Holy": "VAT", "Honduras": "HND", "Hong": "HKG", "Hungary": "HUN",
    "Iceland": "ISL", "Indonesia": "IDN", "Iran": "IRN", "Iraq": "IRQ",
    "Ireland": "IRL", "Israel": "ISR", "Italy": "ITA", "Jamaica": "JAM",
    "Japan": "JPN", "Jordan": "JOR", "Kazakhstan": "KAZ", "Kenya": "KEN",
    "Kiribati": "KIR", "Korea": "KOR", "Kuwait": "KWT", "Kyrgyzstan": "KGZ",
    "Laos": "LAO", "Latvia": "LVA", "Lebanon": "LBN", "Lesotho": "LSO",
    "Liberia": "LBR", "Libya": "LBY", "Liechtenstein": "LIE", "Lithuania": "LTU",
    "Luxembourg": "LUX", "Macao": "MAC", "Madagascar": "MDG", "Malawi": "MWI",
    "Malaysia": "MYS", "Maldives": "MDV", "Mali": "MLI", "Malta": "MLT",
    "Marshall": "MHL", "Mauritania": "MRT", "Mauritius": "MUS", "Mexico": "MEX",
    "Micronesia": "FSM", "Moldova": "MDA", "Monaco": "MCO", "Mongolia": "MNG",
    "Montenegro": "MNE", "Montserrat": "MSR", "Morocco": "MAR", "Mozambique": "MOZ",
    "Myanmar": "MMR", "Namibia": "NAM", "Nauru": "NRU", "Nepal": "NPL",
    "Netherlands": "NLD", "New": "NZL", "Nicaragua": "NIC", "Niger": "NER",
    "Nigeria": "NGA", "Niue": "NIU", "Norway": "NOR", "Oman": "OMN",
    "Pakistan": "PAK", "Palau": "PLW", "Palestine": "PSE", "Panama": "PAN",
    "Papua": "PNG", "Paraguay": "PRY", "Peru": "PER", "Philippines": "PHL",
    "Poland": "POL", "Portugal": "PRT", "Qatar": "QAT", "Romania": "ROU",
    "Russia": "RUS", "Rwanda": "RWA", "Saint": "KNA", "Samoa": "WSM",
    "Sao": "STP", "Saudi": "SAU", "Senegal": "SEN", "Serbia": "SRB",
    "Seychelles": "SYC", "Sierra": "SLE", "Singapore": "SGP", "Slovakia": "SVK",
    "Slovenia": "SVN", "Solomon": "SLB", "Somalia": "SOM", "South": "ZAF",
    "Spain": "ESP", "Sri": "LKA", "Sudan": "SDN", "Suriname": "SUR",
    "Sweden": "SWE", "Switzerland": "CHE", "Syria": "SYR", "Tajikistan": "TJK",
    "Tanzania": "TZA", "Thailand": "THA", "Timor": "TLS", "Togo": "TGO",
    "Tonga": "TON", "Trinidad": "TTO", "Tunisia": "TUN", "Turkey": "TUR",
    "Turkmenistan": "TKM", "Turks": "TCA", "Tuvalu": "TUV", "Uganda": "UGA",
    "Ukraine": "UKR", "United": "GBR", "Uruguay": "URY", "Uzbekistan": "UZB",
    "Vanuatu": "VUT", "Venezuela": "VEN", "Vietnam": "VNM", "Virgin": "VGB",
    "Yemen": "YEM", "Zambia": "ZMB", "Zimbabwe": "ZWE",
}

# Special cases mapping
SPECIAL_CASES = {
    "Korea (DPR)": "PRK",  # North Korea
    "Korea (ROK)": "KOR",  # South Korea
    "Kingdom of Eswatini": "SWZ",  # Eswatini (Swaziland)
    "Türkiye": "TUR",  # Turkey
}

async def extract_country_from_filename(filename: str) -> str | None:
    """Extract country code from bilateral relation PDF filename."""
    # Remove .pdf extension
    name = filename.replace(".pdf", "")
    
    # Check special cases first
    for special_name, iso_code in SPECIAL_CASES.items():
        if special_name.lower() in name.lower():
            return iso_code
    
    # Try to match country names
    for country, iso_code in COUNTRY_ISO_MAPPING.items():
        if country.lower() in name.lower():
            return iso_code
    
    return None


async def get_or_create_country(session: AsyncSession, iso_code: str) -> uuid.UUID | None:
    """Get or create a country record by ISO code."""
    try:
        # Try to find existing country
        stmt = select(Country).where(Country.iso_code == iso_code)
        result = await session.execute(stmt)
        country = result.scalar_one_or_none()
        
        if country:
            return country.id
        
        # Create new country with minimal info
        country = Country(
            id=uuid.uuid4(),
            iso_code=iso_code,
            name=iso_code,  # Placeholder
            region="Unknown",
            continent="Unknown"
        )
        session.add(country)
        await session.commit()
        return country.id
    except Exception as e:
        print(f"  ⚠ Error finding/creating country {iso_code}: {str(e)[:50]}")
        return None


async def seed_mea_pdfs():
    """
    Main seeding function for MEA documents.
    
    Processes all PDF files in MEA folder and:
    1. Creates Document records for each PDF
    2. Extracts country relations from filenames
    3. Seeds CountryRelation records
    4. Updates database metrics
    """
    print("=" * 70)
    print("MEA Bilateral Relations Data Seeding")
    print("=" * 70)
    print(f"Source: {MEA_FOLDER}")
    print()
    
    # Initialize database
    await init_db()
    
    # Import here to get the initialized AsyncSessionLocal
    from db.postgres import AsyncSessionLocal
    
    # Get PDF files
    pdf_files = sorted(MEA_FOLDER.glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDF files to process")
    print()
    
    if not pdf_files:
        print("❌ No PDF files found!")
        return
    
    async with AsyncSessionLocal() as session:
        doc_count = 0
        relation_count = 0
        failed = []
        
        print("Processing PDFs:")
        print("-" * 70)
        
        for idx, pdf_path in enumerate(pdf_files, 1):
            filename = pdf_path.name
            print(f"[{idx}/{len(pdf_files)}]", end=" ")
            
            try:
                # Get file size
                file_size = pdf_path.stat().st_size
                size_mb = file_size / (1024 * 1024)
                
                # Extract country from filename
                country_iso = await extract_country_from_filename(filename)
                
                # Create document record
                doc = Document(
                    id=uuid.uuid4(),
                    title=filename.replace(".pdf", ""),
                    content=f"MEA Bilateral Relations Brief - {filename}",
                    source="MEA",
                    language="en",
                    url=f"https://www.mea.gov.in/Portal/ForeignRelation/{filename}",
                    published_date=datetime.utcnow(),
                    processed=False,
                    doc_metadata={
                        "file_size_mb": round(size_mb, 3),
                        "file_size_bytes": file_size,
                        "country_iso": country_iso,
                        "document_type": "bilateral_brief",
                        "source_organization": "Ministry of External Affairs India",
                        "classification": "UNCLASSIFIED",
                    }
                )
                
                session.add(doc)
                await session.flush()
                doc_count += 1
                
                # Create country relation if country found
                if country_iso:
                    # Get India country
                    india_stmt = select(Country).where(Country.iso_code == "IND")
                    india_result = await session.execute(india_stmt)
                    india = india_result.scalar_one_or_none()
                    
                    if not india:
                        # Create India if doesn't exist
                        india = Country(
                            id=uuid.uuid4(),
                            iso_code="IND",
                            name="India",
                            region="South Asia",
                            continent="Asia"
                        )
                        session.add(india)
                        await session.flush()
                    
                    # Get or create other country
                    other_country_id = await get_or_create_country(session, country_iso)
                    
                    if other_country_id:
                        # Check if relation already exists
                        rel_stmt = select(CountryRelation).where(
                            CountryRelation.country_a_id == india.id,
                            CountryRelation.country_b_id == other_country_id
                        )
                        rel_result = await session.execute(rel_stmt)
                        existing_rel = rel_result.scalar_one_or_none()
                        
                        if not existing_rel:
                            # Create new relation
                            relation = CountryRelation(
                                id=uuid.uuid4(),
                                country_a_id=india.id,
                                country_b_id=other_country_id,
                                relation_type="bilateral",
                                status="stable",
                                sentiment="neutral",
                                confidence_score=0.8,
                                source="MEA",
                                agreements=[],
                                key_issues=[],
                            )
                            session.add(relation)
                            await session.flush()
                            relation_count += 1
                            print(f"[OK] {filename} ({country_iso}) (REL)")
                        else:
                            print(f"[OK] {filename} ({country_iso})")
                    else:
                        print(f"[OK] {filename} ({country_iso}) [country error]")
                else:
                    print(f"[OK] {filename} [no country match]")
                
            except Exception as e:
                print(f"[FAIL] {filename}: {str(e)[:40]}")
                failed.append((filename, str(e)))
        
        # Commit all changes
        try:
            await session.commit()
            print()
            print("=" * 70)
            print("MEA DATA SEEDING SUMMARY")
            print("=" * 70)
            print(f"[OK] Documents created: {doc_count}")
            print(f"[OK] Relations created: {relation_count}")
            print(f"[FAIL] Failed: {len(failed)}")
            print(f"Total PDFs processed: {len(pdf_files)}")
            print()
            
            if failed:
                print("Failed files:")
                for filename, error in failed[:10]:
                    print(f"  - {filename}: {error[:50]}")
            
            print("=" * 70)
            
        except Exception as e:
            print(f"❌ Failed to commit: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(seed_mea_pdfs())
