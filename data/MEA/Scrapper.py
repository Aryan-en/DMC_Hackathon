"""
MEA Foreign Relations PDF Scraper

Scrapes all bilateral relations PDFs from:
https://www.mea.gov.in/foreign-relations.htm

Downloads all PDFs to the MEA folder with progress tracking.
"""

import os
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import time
from datetime import datetime

# Configuration
MEA_BASE_URL = "https://www.mea.gov.in"
FOREIGN_RELATIONS_URL = f"{MEA_BASE_URL}/foreign-relations.htm"
OUTPUT_DIR = Path(__file__).parent  # Current MEA folder
TIMEOUT = 30
RETRY_ATTEMPTS = 3
RETRY_DELAY = 2

# Session for persistent connections
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})


def get_pdf_links(content):
    """
    Extract all PDF links from the page content.
    
    Returns:
        list: List of tuples (url, filename)
    """
    soup = BeautifulSoup(content, 'html.parser')
    pdf_links = []
    
    # Find all links with href attribute
    for link in soup.find_all('a', href=True):
        href = link['href']
        
        # Check if it's a PDF link
        if href.endswith('.pdf'):
            # Make absolute URL
            if not href.startswith('http'):
                href = urljoin(MEA_BASE_URL, href)
            
            # Extract filename
            filename = urlparse(href).path.split('/')[-1]
            if filename:
                pdf_links.append((href, filename))
    
    # Remove duplicates while preserving order
    seen = set()
    unique_links = []
    for url, filename in pdf_links:
        if url not in seen:
            seen.add(url)
            unique_links.append((url, filename))
    
    return unique_links


def download_pdf(url, filename, attempt=1):
    """
    Download a single PDF with retry logic.
    
    Args:
        url (str): PDF URL
        filename (str): Output filename
        attempt (int): Current attempt number
        
    Returns:
        bool: True if successful, False otherwise
    """
    filepath = OUTPUT_DIR / filename
    
    # Skip if already exists
    if filepath.exists():
        print(f"  ✓ {filename} (already exists)")
        return True
    
    try:
        print(f"  ↓ Downloading {filename}...", end=" ", flush=True)
        response = session.get(url, timeout=TIMEOUT, stream=True)
        response.raise_for_status()
        
        # Write to file
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        # Verify file size
        size_mb = filepath.stat().st_size / (1024 * 1024)
        print(f"✓ ({size_mb:.2f} MB)")
        return True
        
    except requests.RequestException as e:
        if attempt < RETRY_ATTEMPTS:
            print(f"✗ (retrying...)")
            time.sleep(RETRY_DELAY)
            return download_pdf(url, filename, attempt + 1)
        else:
            print(f"✗ Failed: {str(e)[:50]}")
            return False
    except Exception as e:
        print(f"✗ Error: {str(e)[:50]}")
        return False


def scrape_mea_pdfs():
    """
    Main scraping function.
    
    Fetches the foreign relations page, extracts PDF links,
    and downloads all PDFs to the MEA folder.
    """
    print("=" * 70)
    print("MEA Foreign Relations PDF Scraper")
    print("=" * 70)
    print(f"Source: {FOREIGN_RELATIONS_URL}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    try:
        # Fetch the main page
        print("Fetching foreign relations page...")
        response = session.get(FOREIGN_RELATIONS_URL, timeout=TIMEOUT)
        response.raise_for_status()
        
        # Extract PDF links
        print("Extracting PDF links...")
        pdf_links = get_pdf_links(response.content)
        print(f"Found {len(pdf_links)} PDF(s)")
        print()
        
        if not pdf_links:
            print("❌ No PDFs found!")
            return
        
        # Download all PDFs
        print("Downloading PDFs:")
        print("-" * 70)
        
        successful = 0
        failed = 0
        
        for i, (url, filename) in enumerate(pdf_links, 1):
            print(f"[{i}/{len(pdf_links)}]", end=" ")
            if download_pdf(url, filename):
                successful += 1
            else:
                failed += 1
        
        # Summary
        print()
        print("=" * 70)
        print("SCRAPING SUMMARY")
        print("=" * 70)
        print(f"✓ Downloaded: {successful}")
        print(f"✗ Failed: {failed}")
        print(f"Total: {len(pdf_links)}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
    except requests.RequestException as e:
        print(f"❌ Failed to fetch page: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Run scraper
    scrape_mea_pdfs()
