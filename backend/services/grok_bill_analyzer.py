"""Grok API Client for Efficient Bill Analysis - Optimized for 300+ Page Documents"""

import json
import logging
import asyncio
from typing import Optional, dict, list, tuple
from datetime import datetime
import httpx
from config import Settings

logger = logging.getLogger(__name__)


class GrokBillAnalyzer:
    """
    Efficient bill analysis using X.AI's Grok API.
    Optimized for processing large documents (300+ pages) with smart chunking.
    """
    
    def __init__(self, settings: Settings):
        self.api_key = settings.GROK_API_KEY
        self.api_base_url = settings.GROK_API_BASE_URL
        self.model = settings.GROK_MODEL
        self.max_tokens = settings.GROK_MAX_TOKENS
        self.temperature = settings.GROK_TEMPERATURE
        self.chunk_size = settings.GROK_CHUNK_SIZE
        self.max_retries = settings.GROK_MAX_RETRIES
        self.timeout = settings.GROK_TIMEOUT_SEC
        
        if not self.api_key:
            logger.warning("GROK_API_KEY not configured. Using mock analysis mode.")
            self.enabled = False
        else:
            self.enabled = True
    
    async def analyze_bill(self, text: str, logs: list) -> tuple[dict, list]:
        """
        Analyze bill text using Grok API with intelligent chunking for large documents.
        
        Returns:
            (analysis_dict, logs_list)
        """
        
        if not self.enabled:
            logs.append("⚠ Grok API disabled - using mock analysis")
            return await self._mock_analysis(text, logs)
        
        try:
            # Step 1: Analyze document structure
            logs.append("✓ Analyzing document structure...")
            word_count = len(text.split())
            pages_estimate = max(1, word_count // 250)  # ~250 words per page
            logs.append(f"✓ Estimated {pages_estimate} pages ({word_count} words)")
            
            # Step 2: Smart chunking for large documents
            logs.append("✓ Preparing document chunks for analysis...")
            chunks = self._create_smart_chunks(text)
            logs.append(f"✓ Document split into {len(chunks)} chunks for processing")
            
            # Step 3: Extract bill metadata with single Grok call
            logs.append("✓ Extracting bill metadata and structure...")
            metadata = await self._extract_metadata(text, logs)
            
            # Step 4: Parallel analysis of key sections
            logs.append("✓ Running parallel analysis of key sections...")
            analysis_tasks = [
                self._analyze_summary_section(chunks, metadata, logs),
                self._analyze_pros_cons(chunks, logs),
                self._analyze_economic_impact(chunks, logs),
                self._analyze_risk_assessment(chunks, logs),
                self._analyze_global_impact(chunks, logs),
                self._analyze_stakeholders(chunks, logs)
            ]
            
            results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
            logs.append("✓ Aggregating analysis results...")
            
            # Step 5: Synthesize results
            final_analysis = self._synthesize_results(metadata, results, logs)
            logs.append("✓ Analysis complete!")
            
            return final_analysis, logs
            
        except Exception as e:
            logger.error(f"Grok analysis error: {str(e)}")
            logs.append(f"✗ Grok API error: {str(e)}")
            return await self._mock_analysis(text, logs)
    
    async def _extract_metadata(self, text: str, logs: list) -> dict:
        """Extract bill title, country, and basic metadata"""
        
        # Use first 2000 chars for metadata extraction
        preview = text[:2000]
        
        prompt = f"""Analyze this bill document preview and extract metadata:

{preview}

Return ONLY valid JSON with these fields:
{{
    "bill_title": "string",
    "country": "string", 
    "bill_type": "string",
    "primary_subject": "string",
    "overview": "string"
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            metadata = self._extract_json(response)
            logs.append(f"✓ Extracted metadata: {metadata.get('bill_title', 'Unknown')}")
            return metadata
        except Exception as e:
            logger.warning(f"Metadata extraction failed: {str(e)}")
            return {"bill_title": "Bill Analysis", "country": "Unknown"}
    
    async def _analyze_summary_section(self, chunks: list, metadata: dict, logs: list) -> dict:
        """Analyze bill summary - uses first 2-3 chunks"""
        
        summary_chunks = chunks[:min(3, len(chunks))]
        chunk_text = "\n---\n".join(summary_chunks)
        
        prompt = f"""Based on this bill content, provide a concise summary:

{chunk_text[:6000]}

Return ONLY valid JSON:
{{
    "bill_summary": "string (2-3 sentences)",
    "type": "string",
    "scope": "string"
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            return self._extract_json(response)
        except Exception as e:
            logger.warning(f"Summary analysis failed: {str(e)}")
            return {"bill_summary": "Bill analysis in progress"}
    
    async def _analyze_pros_cons(self, chunks: list, logs: list) -> dict:
        """Analyze advantages and disadvantages"""
        
        # Use middle chunks which often contain detailed provisions
        middle_start = len(chunks) // 4
        middle_end = middle_start + min(4, len(chunks) // 3)
        analysis_chunks = chunks[middle_start:middle_end]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Analyze the pros and cons of this legislation:

{chunk_text[:6000]}

Return ONLY valid JSON:
{{
    "pros": ["string", ...],
    "cons": ["string", ...]
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            return self._extract_json(response)
        except Exception as e:
            logger.warning(f"Pros/cons analysis failed: {str(e)}")
            return {"pros": [], "cons": []}
    
    async def _analyze_economic_impact(self, chunks: list, logs: list) -> dict:
        """Analyze economic impact and sector effects"""
        
        analysis_chunks = chunks[::max(1, len(chunks)//4)]  # Sample chunks
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Analyze the economic impact of this legislation:

{chunk_text[:6000]}

Return ONLY valid JSON:
{{
    "gdp_impact": float between -5 and 5,
    "employment_impact": float between -3 and 5,
    "inflation_impact": float between -2 and 3,
    "sector_effects": [
        {{"sector": "string", "impact": float}},
        ...
    ]
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            data = self._extract_json(response)
            return {"national_impact": data}
        except Exception as e:
            logger.warning(f"Economic impact analysis failed: {str(e)}")
            return {"national_impact": {}}
    
    async def _analyze_risk_assessment(self, chunks: list, logs: list) -> dict:
        """Analyze risks and mitigation strategies"""
        
        analysis_chunks = chunks[len(chunks)//2:len(chunks)//2 + min(3, len(chunks)//4)]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Assess the risks and mitigation strategies for this legislation:

{chunk_text[:6000]}

Return ONLY valid JSON:
{{
    "risk_level": "LOW|MEDIUM|HIGH",
    "probability": float between 0 and 1,
    "mitigation_strategies": ["string", ...]
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            data = self._extract_json(response)
            return {"risk_assessment": data}
        except Exception as e:
            logger.warning(f"Risk assessment failed: {str(e)}")
            return {"risk_assessment": {}}
    
    async def _analyze_global_impact(self, chunks: list, logs: list) -> dict:
        """Analyze global and geopolitical impact"""
        
        analysis_chunks = chunks[::max(1, len(chunks)//3)]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Analyze the global and geopolitical impact of this legislation:

{chunk_text[:6000]}

Return ONLY valid JSON:
{{
    "trade_relations": ["string", ...],
    "geopolitical_influence": float between 0 and 1,
    "affected_regions": ["string", ...]
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            data = self._extract_json(response)
            return {"global_impact": data}
        except Exception as e:
            logger.warning(f"Global impact analysis failed: {str(e)}")
            return {"global_impact": {}}
    
    async def _analyze_stakeholders(self, chunks: list, logs: list) -> dict:
        """Identify and analyze stakeholders"""
        
        analysis_chunks = chunks[len(chunks)//3:len(chunks)//2]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Identify key stakeholders and their positions on this legislation:

{chunk_text[:6000]}

Return ONLY valid JSON:
{{
    "stakeholders": [
        {{"stakeholder": "string", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL|MIXED", "influence": float}},
        ...
    ]
}}"""
        
        try:
            response = await self._call_grok_api(prompt)
            data = self._extract_json(response)
            return {"stakeholder_analysis": data.get("stakeholders", [])}
        except Exception as e:
            logger.warning(f"Stakeholder analysis failed: {str(e)}")
            return {"stakeholder_analysis": []}
    
    async def _call_grok_api(self, prompt: str) -> str:
        """Call Grok API with retry logic"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a legislative analysis expert. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.api_base_url}/chat/completions",
                        json=payload,
                        headers=headers
                    )
                    response.raise_for_status()
                    
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                    
            except httpx.TimeoutException:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Grok API timeout, retrying... (attempt {attempt + 1})")
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    raise
            except Exception as e:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Grok API error: {str(e)}, retrying...")
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
        
        raise Exception("Max retries exceeded")
    
    def _create_smart_chunks(self, text: str) -> list[str]:
        """
        Create intelligent chunks by:
        1. Splitting on logical boundaries (sections, paragraphs)
        2. Respecting word limits
        3. Avoiding breaking mid-sentence
        """
        
        # Split by double newlines first (sections)
        sections = text.split("\n\n")
        
        chunks = []
        current_chunk = ""
        current_words = 0
        
        for section in sections:
            section_words = len(section.split())
            
            # If section is too large, further split by sentences
            if section_words > self.chunk_size:
                # Split by periods and exclamation/question marks
                sentences = section.replace("?", ".").replace("!", ".").split(".")
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    sentence_words = len(sentence.split())
                    if current_words + sentence_words > self.chunk_size and current_chunk:
                        chunks.append(current_chunk)
                        current_chunk = sentence
                        current_words = sentence_words
                    else:
                        current_chunk += sentence + ". " if current_chunk else sentence + ". "
                        current_words += sentence_words
            else:
                # Add entire section if it fits
                if current_words + section_words > self.chunk_size and current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = section
                    current_words = section_words
                else:
                    current_chunk += "\n\n" + section if current_chunk else section
                    current_words += section_words
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def _extract_json(self, response: str) -> dict:
        """Extract JSON from response"""
        
        # Try to find JSON in response
        start_idx = response.find("{")
        end_idx = response.rfind("}") + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response[start_idx:end_idx]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                logger.warning("JSON parsing failed, returning empty dict")
                return {}
        
        return {}
    
    def _synthesize_results(self, metadata: dict, results: list, logs: list) -> dict:
        """Combine all analysis results into final output"""
        
        analysis = {
            "bill_title": metadata.get("bill_title", "Bill Analysis"),
            "country": metadata.get("country", "Unknown"),
            "bill_summary": "",
            "pros": [],
            "cons": [],
            "national_impact": {},
            "global_impact": {},
            "risk_assessment": {},
            "stakeholder_analysis": [],
            "implementation_timeline": self._generate_timeline(),
            "comparative_analysis": self._generate_comparatives()
        }
        
        for result in results:
            if isinstance(result, Exception):
                continue
            if isinstance(result, dict):
                analysis.update(result)
        
        return analysis
    
    def _generate_timeline(self) -> list:
        """Generate implementation timeline"""
        return [
            {
                "phase": "Regulatory Framework Development",
                "duration": "6-12 months",
                "milestones": ["Establish oversight mechanisms", "Create guidelines", "Stakeholder feedback"]
            },
            {
                "phase": "Business Preparation",
                "duration": "12-24 months",
                "milestones": ["Compliance assessment", "System updates", "Staff training"]
            },
            {
                "phase": "Full Enforcement",
                "duration": "24+ months",
                "milestones": ["Field audits", "Penalty phase", "Review cycles"]
            }
        ]
    
    def _generate_comparatives(self) -> list:
        """Generate comparative analysis placeholder"""
        return [
            {
                "country": "To be analyzed",
                "similar_bill": "Pending detailed research",
                "outcome": "Analysis will compare with precedent legislation"
            }
        ]
    
    async def _mock_analysis(self, text: str, logs: list) -> tuple[dict, list]:
        """Fallback mock analysis when API is unavailable"""
        
        logs.append("✓ Using fallback analysis mode")
        word_count = len(text.split())
        
        return {
            "bill_title": "Legislative Analysis",
            "country": "Unknown",
            "bill_summary": f"This document contains approximately {word_count} words. Full AI-powered analysis requires Grok API configuration.",
            "pros": ["Comprehensive coverage", "Detailed provisions"],
            "cons": ["Implementation complexity"],
            "national_impact": {
                "gdp_impact": 0.5,
                "employment_impact": 0.2,
                "inflation_impact": 0.1,
                "sector_effects": []
            },
            "global_impact": {
                "geopolitical_influence": 0.3,
                "trade_relations": [],
                "affected_regions": []
            },
            "risk_assessment": {
                "risk_level": "MEDIUM",
                "probability": 0.5,
                "mitigation_strategies": []
            },
            "stakeholder_analysis": [],
            "implementation_timeline": self._generate_timeline(),
            "comparative_analysis": self._generate_comparatives()
        }, logs
