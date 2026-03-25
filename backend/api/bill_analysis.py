"""Bill Amendment Analysis API Endpoints - Powered by Gemini/Grok for Efficient Processing"""

import os
import json
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import PyPDF2
import io
from datetime import datetime
import logging

from db.postgres import get_db_session
from db.schemas import BillAnalysis
from utils.response import build_error, build_success
from core.config import settings
from services.grok_bill_analyzer import GrokBillAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)
grok_analyzer = GrokBillAnalyzer(settings)

UPLOAD_DIR = os.path.join("uploads", "bills")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze")
async def analyze_bill(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db_session)
):
    """
    POST /api/bill-analysis/analyze - Analyze uploaded bill document using Gemini (preferred) or Grok
    
    Optimized for:
    - 300+ page documents
    - Parallel analysis of multiple sections
    - Intelligent chunking for efficient processing
    - Streaming progress updates
    """
    
    logs = []
    progress = 0
    
    try:
        # Step 1: Validate & Read (15%)
        progress = 15
        contents = None
        filename = None
        source_url = url
        
        if file:
            logs.append(f"✓ Validating uploaded file: {file.filename}")
            if not file.filename or not file.filename.endswith('.pdf'):
                return build_error("INVALID_FILE", "Only PDF files are accepted", progress=progress, logs=logs)
            contents = await file.read()
            filename = file.filename
        elif url:
            logs.append(f"✓ Fetching PDF from tactical URL: {url}")
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    contents = resp.content
                    filename = url.split('/')[-1] if '/' in url else "downloaded_bill.pdf"
                    if not filename.endswith('.pdf'): filename += ".pdf"
            except Exception as download_err:
                logs.append(f"✗ Failed to download PDF: {str(download_err)}")
                return build_error("DOWNLOAD_ERROR", "Failed to fetch PDF from URL", progress=progress, logs=logs)
        else:
            return build_error("NO_INPUT", "Please provide a file or a PDF URL", progress=progress, logs=logs)

        try:
            if not contents:
                return build_error("EMPTY_FILE", "No content found in document", progress=progress, logs=logs)
            
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
        
        # Step 2: Run AI analysis with intelligent chunking (40%)
        progress = 45
        provider_name = grok_analyzer.provider.upper() if grok_analyzer.enabled else "MOCK"
        active_model = settings.GEMINI_MODEL if grok_analyzer.provider == "gemini" else settings.GROK_MODEL
        logs.append(f"✓ Initializing {provider_name} analysis for parallel processing...")
        logs.append(f"  → Model: {active_model}")
        logs.append(f"  → Chunk size: {settings.GROK_CHUNK_SIZE} words")
        logs.append("✓ Starting multi-section analysis...")
        
        # Use configured provider for comprehensive analysis
        analysis, analysis_logs = await grok_analyzer.analyze_bill(extracted_text, logs)
        logs.extend(analysis_logs)
        
        # Step 3: Persistence (90%)
        progress = 90
        logs.append("✓ Saving analysis to strategic archive...")
        
        # Save file physically
        safe_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Save to DB
        bill_db_entry = BillAnalysis(
            bill_title=analysis.get("bill_title", filename),
            filename=filename,
            file_path=file_path,
            source_url=source_url,
            status="completed",
            analysis_data=analysis,
            model_used=active_model,
            provider=grok_analyzer.provider,
            pages=pages,
            words=len(extracted_text.split())
        )
        db.add(bill_db_entry)
        await db.commit()
        await db.refresh(bill_db_entry)
        
        # Step 4: Finalize (100%)
        progress = 100
        logs.append("✅ Analysis complete! Bill processed successfully.")
        
        response_data = {
            "analysis_id": str(bill_db_entry.id),
            "pages": pages,
            "words": len(extracted_text.split()),
            "provider": grok_analyzer.provider,
            "model": active_model,
            "filename": filename,
            "source_url": source_url,
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
        from sqlalchemy import select, desc
        result = await db.execute(
            select(BillAnalysis).order_by(desc(BillAnalysis.created_at)).limit(limit)
        )
        entries = result.scalars().all()
        
        history = [
            {
                "id": str(entry.id),
                "bill_title": entry.bill_title,
                "country": entry.analysis_data.get("country", "Unknown"),
                "analyzed_at": entry.created_at.isoformat(),
                "status": entry.status,
                "pages": entry.pages,
                "provider": entry.provider,
                "model": entry.model_used,
                "source_url": entry.source_url
            }
            for entry in entries
        ]
        
        return build_success({"history": history})
    except Exception as e:
        logger.error(f"History retrieval error: {str(e)}")
        return build_error("HISTORY_ERROR", f"Failed to retrieve history: {str(e)}")


@router.get("/history/{analysis_id}")
async def get_analysis_detail(
    analysis_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """GET /api/bill-analysis/history/{id} - Get detail of a specific analysis"""
    
    try:
        from sqlalchemy import select
        result = await db.execute(
            select(BillAnalysis).filter(BillAnalysis.id == analysis_id)
        )
        entry = result.scalar_one_or_none()
        
        if not entry:
            return build_error("NOT_FOUND", "Analysis not found")
            
        return build_success(entry)
    except Exception as e:
        logger.error(f"Detail retrieval error: {str(e)}")
        return build_error("DETAIL_ERROR", f"Failed to retrieve analysis detail: {str(e)}")


@router.get("/download/{analysis_id}")
async def download_archived_bill(
    analysis_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """GET /api/bill-analysis/download/{id} - Serve the archived PDF file"""
    try:
        from sqlalchemy import select
        result = await db.execute(select(BillAnalysis).filter(BillAnalysis.id == analysis_id))
        entry = result.scalar_one_or_none()
        
        if not entry or not entry.file_path or not os.path.exists(entry.file_path):
            return build_error("NOT_FOUND", "Archived document not found")
            
        return FileResponse(
            path=entry.file_path,
            media_type="application/pdf",
            filename=entry.filename
        )
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return build_error("DOWNLOAD_ERROR", f"Failed to serve file: {str(e)}")


@router.get("/status")
async def analysis_status():
    """GET /api/bill-analysis/status - Check bill analysis provider status and configuration"""
    
    try:
        status = {
            "analysis_enabled": grok_analyzer.enabled,
            "provider": grok_analyzer.provider,
            "model": (settings.GEMINI_MODEL if grok_analyzer.provider == "gemini" else settings.GROK_MODEL) if grok_analyzer.enabled else "N/A",
            "gemini_enabled": bool(settings.GEMINI_API_KEY),
            "grok_enabled": bool(settings.GROK_API_KEY),
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
