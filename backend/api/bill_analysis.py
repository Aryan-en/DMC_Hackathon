"""Bill Amendment Analysis API Endpoints - Powered by Grok API for Efficient Processing"""

import os
import json
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import PyPDF2
import io
from datetime import datetime
import logging

from db.postgres import get_db_session
from utils.response import build_error, build_success
from config import Settings
from services.grok_bill_analyzer import GrokBillAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Grok analyzer for 300+ page bill processing
settings = Settings()
grok_analyzer = GrokBillAnalyzer(settings)


@router.post("/analyze")
async def analyze_bill(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session)
):
    """
    POST /api/bill-analysis/analyze - Analyze uploaded bill document using Grok API
    
    Optimized for:
    - 300+ page documents
    - Parallel analysis of multiple sections
    - Intelligent chunking for efficient processing
    - Streaming progress updates
    """
    
    logs = []
    progress = 0
    
    try:
        # Step 1: Validate & Read PDF (15%)
        progress = 15
        logs.append("✓ Validating PDF file...")
        if not file.filename or not file.filename.endswith('.pdf'):
            return build_error("INVALID_FILE", "Only PDF files are accepted", progress=progress, logs=logs)
        
        try:
            contents = await file.read()
            if not contents:
                return build_error("EMPTY_FILE", "File is empty", progress=progress, logs=logs)
            
            pdf_file = io.BytesIO(contents)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            pages = len(pdf_reader.pages)
            logs.append(f"✓ Loaded PDF with {pages} pages")
            
            # Extract text from all pages - optimized batch processing
            progress = 25
            logs.append("✓ Extracting text from all pages...")
            extracted_text = ""
            for idx, page in enumerate(pdf_reader.pages):
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
                
                # Update progress every 50 pages
                if (idx + 1) % 50 == 0:
                    progress = 25 + (idx / pages) * 20
                    logs.append(f"  → Extracted pages {idx + 1}/{pages}")
            
        except Exception as pdf_err:
            logs.append(f"✗ PDF parsing error: {str(pdf_err)}")
            return build_error("PDF_ERROR", f"Failed to read PDF: {str(pdf_err)}", progress=progress, logs=logs)
        
        if not extracted_text.strip():
            logs.append("⚠ No text extracted - using fallback analysis")
            extracted_text = f"[PDF with {pages} pages detected but text extraction failed]"
        else:
            word_count = len(extracted_text.split())
            logs.append(f"✓ Extracted {word_count} words from {pages} pages")
        
        # Step 2: Run Grok Analysis with intelligent chunking (40%)
        progress = 45
        logs.append("✓ Initializing Grok API for parallel analysis...")
        logs.append(f"  → Model: {settings.GROK_MODEL}")
        logs.append(f"  → Chunk size: {settings.GROK_CHUNK_SIZE} words")
        logs.append("✓ Starting multi-section analysis...")
        
        # Use Grok for comprehensive analysis
        analysis, analysis_logs = await grok_analyzer.analyze_bill(extracted_text, logs)
        logs.extend(analysis_logs)
        
        # Step 3: Finalize (100%)
        progress = 100
        logs.append("✅ Analysis complete! Bill processed successfully.")
        
        response_data = {
            "analysis_id": "bill_" + datetime.utcnow().isoformat(),
            "pages": pages,
            "words": len(extracted_text.split()),
            **analysis
        }
        
        return build_success(response_data, progress=progress, logs=logs)
        
    except Exception as exc:
        import traceback
        error_detail = str(exc)
        traceback.print_exc()
        logger.error(f"Bill analysis error: {error_detail}")
        logs.append(f"✗ Error: {error_detail}")
        return build_error("ANALYSIS_ERROR", f"Failed to analyze bill: {error_detail}", progress=progress, logs=logs)


@router.get("/history")
async def get_analysis_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db_session)
):
    """GET /api/bill-analysis/history - Get previous bill analyses"""
    
    try:
        # In production, query from database
        # For now, return mock data
        history = [
            {
                "id": "bill_1",
                "bill_title": "Digital Privacy Protection Act",
                "country": "United States",
                "analyzed_at": "2026-03-22T10:30:00",
                "risk_level": "HIGH",
                "pages": 247
            },
            {
                "id": "bill_2",
                "bill_title": "Renewable Energy Transition Act",
                "country": "Germany",
                "analyzed_at": "2026-03-21T14:15:00",
                "risk_level": "MEDIUM",
                "pages": 156
            },
            {
                "id": "bill_3",
                "bill_title": "Trade Facilitation Act",
                "country": "China",
                "analyzed_at": "2026-03-20T09:45:00",
                "risk_level": "MEDIUM",
                "pages": 189
            },
        ]
        
        return build_success({"history": history[:limit]})
    except Exception as e:
        logger.error(f"History retrieval error: {str(e)}")
        return build_error("HISTORY_ERROR", f"Failed to retrieve history: {str(e)}")


@router.get("/status")
async def analysis_status():
    """GET /api/bill-analysis/status - Check Grok API status and configuration"""
    
    try:
        status = {
            "grok_enabled": grok_analyzer.enabled,
            "model": settings.GROK_MODEL if grok_analyzer.enabled else "N/A",
            "chunk_size": settings.GROK_CHUNK_SIZE,
            "max_tokens": settings.GROK_MAX_TOKENS,
            "timeout_sec": settings.GROK_TIMEOUT_SEC,
            "max_retries": settings.GROK_MAX_RETRIES,
            "temperature": settings.GROK_TEMPERATURE,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return build_success(status)
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        return build_error("STATUS_ERROR", f"Failed to check status: {str(e)}")
