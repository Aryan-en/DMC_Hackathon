"""Ingestor for processing local folders (MEA PDFs and IndiAPI JSON)."""

import os
import json
import logging
import PyPDF2
from datetime import datetime, timezone
from uuid import uuid4

logger = logging.getLogger(__name__)

async def run_folder_ingestion(mea_dir: str, indiapi_dir: str, limit: int = None) -> list[dict]:
    """Process local folders and return document-like dictionaries."""
    all_docs = []
    processed_count = 0

    # 1. Process MEA Bilateral Briefs (PDFs)
    if os.path.exists(mea_dir):
        logger.info(f"Processing MEA briefs from {mea_dir}...")
        for filename in os.listdir(mea_dir):
            if limit and processed_count >= limit:
                break
            if filename.lower().endswith(".pdf"):
                filepath = os.path.join(mea_dir, filename)
                try:
                    text = ""
                    with open(filepath, "rb") as f:
                        reader = PyPDF2.PdfReader(f)
                        for page in reader.pages:
                            text += page.extract_text() or ""
                    
                    if not text.strip():
                        continue

                    # Prioritize India
                    india_priority = "India" in filename or "India" in text[:500]
                    
                    all_docs.append({
                        "title": filename.replace(".pdf", "").replace("_", " "),
                        "content": text,
                        "source": "MEA",
                        "url": f"local://mea/{filename}",
                        "metadata": {
                            "filename": filename,
                            "india_priority": india_priority,
                            "type": "bilateral_brief"
                        }
                    })
                    processed_count += 1
                except Exception as e:
                    logger.error(f"Failed to parse MEA PDF {filename}: {str(e)}")

    # 2. Process IndiAPIs (JSON)
    if os.path.exists(indiapi_dir):
        logger.info(f"Processing IndiAPIs from {indiapi_dir}...")
        json_files = ["comprehensive.json", "indiapi_comprehensive.json"]
        found_json = False
        for jf in json_files:
            comprehensive_path = os.path.join(indiapi_dir, jf)
            if os.path.exists(comprehensive_path):
                found_json = True
                try:
                    with open(comprehensive_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        items = data if isinstance(data, list) else data.get("data", [])
                        for item in items:
                            content = item.get("content") or item.get("description") or ""
                            all_docs.append({
                                "title": item.get("title") or "IndiAPI Intelligence Item",
                                "content": content,
                                "source": "INDIAPI",
                                "url": item.get("url") or f"local://indiapi/{uuid4()}",
                                "metadata": {
                                    "india_priority": True,
                                    "tags": item.get("tags", []),
                                    "category": item.get("category", "GEOPOLITICAL")
                                }
                            })
                except Exception as e:
                    logger.error(f"Failed to parse IndiAPI JSON {jf}: {str(e)}")
        
        if not found_json:
            # Maybe check any JSON in the folder?
            for filename in os.listdir(indiapi_dir):
                if filename.lower().endswith(".json"):
                    # skip already tried
                    if filename in json_files: continue
                    # ... logic to parse others if needed
                    pass

    logger.info(f"Folder ingestion complete. Total documents: {len(all_docs)}")

    return all_docs
