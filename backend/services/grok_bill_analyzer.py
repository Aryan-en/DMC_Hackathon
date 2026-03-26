"""Grok API Client for Efficient Bill Analysis - Optimized for 300+ Page Documents"""

import json
import logging
import asyncio
import re
from typing import Any, Optional
from datetime import datetime
import httpx
from core.config import Settings

logger = logging.getLogger(__name__)


class GrokBillAnalyzer:
    """
    Efficient bill analysis using X.AI's Grok API.
    Optimized for processing large documents (300+ pages) with smart chunking.
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.gemini_api_base_url = settings.GEMINI_API_BASE_URL
        self.gemini_model = settings.GEMINI_MODEL

        self.api_key = settings.GROK_API_KEY
        self.api_base_url = settings.GROK_API_BASE_URL
        self.model = settings.GROK_MODEL
        self.max_tokens = settings.GROK_MAX_TOKENS
        self.temperature = settings.GROK_TEMPERATURE
        self.chunk_size = settings.GROK_CHUNK_SIZE
        self.max_retries = settings.GROK_MAX_RETRIES
        self.timeout = settings.GROK_TIMEOUT_SEC
        
        self.provider = "gemini" if self.gemini_api_key else "mock"

        if self.provider == "mock":
            logger.warning("No LLM API key configured (GEMINI_API_KEY). Using mock analysis mode.")
            self.enabled = False
        else:
            self.enabled = True

    async def analyze_pdf_document(
        self,
        pdf_bytes: bytes,
        filename: str,
        logs: list,
        fallback_text: str = "",
    ) -> tuple[dict, list]:
        """Analyze an entire PDF using Gemini File API + structured output in one holistic call."""

        if not self.enabled:
            logs.append("⚠ AI provider disabled - using mock analysis")
            return await self._mock_analysis(fallback_text or "", logs)

        file_name: Optional[str] = None
        file_uri: Optional[str] = None

        try:
            logs.append("✓ Uploading PDF to Gemini File API...")
            file_name, file_uri = await self._upload_pdf_to_gemini(pdf_bytes, filename)
            logs.append("✓ PDF upload complete")

            logs.append("✓ Running holistic full-document analysis...")
            holistic = await self._call_gemini_comprehensive(file_uri)
            analysis = self._normalize_holistic_analysis(holistic, filename)

            analysis["analysis_provider"] = self.provider
            analysis["analysis_model"] = self.gemini_model if self.provider == "gemini" else "none"
            logs.append("✓ Holistic analysis complete")
            return analysis, logs
        except Exception as e:
            logger.error(f"Holistic PDF analysis failed: {str(e)}")
            logs.append(f"✗ Holistic PDF analysis error: {str(e)}")

            # Do not silently downgrade to mock when quota/rate-limit errors occur.
            if "429" in str(e):
                raise RuntimeError("Gemini API rate limit reached. Please retry later or use a higher-quota model/key.")

            if fallback_text.strip():
                logs.append("⚠ Falling back to text-based analysis mode")
                return await self.analyze_bill(fallback_text, logs)
            return await self._mock_analysis("", logs)
        finally:
            if file_name:
                await self._delete_uploaded_file(file_name)
    
    async def analyze_bill(self, text: str, logs: list) -> tuple[dict, list]:
        """
        Analyze bill text using Grok API with intelligent chunking for large documents.
        
        Returns:
            (analysis_dict, logs_list)
        """
        
        if not self.enabled:
            logs.append("⚠ AI provider disabled - using mock analysis")
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
            logs.append("✓ Running unified analysis pass...")
            unified_result = await self._analyze_unified(chunks, metadata, logs)

            if unified_result:
                final_analysis = self._merge_unified_analysis(metadata, unified_result)
                logs.append("✓ Unified analysis complete!")
                final_analysis["analysis_provider"] = self.provider
                final_analysis["analysis_model"] = self.gemini_model if self.provider == "gemini" else "none"
                return final_analysis, logs

            logs.append("⚠ Unified pass failed, falling back to section-by-section mode...")
            logs.append("✓ Running parallel analysis of key sections...")
            analysis_tasks = [
                self._analyze_summary_section(chunks, metadata, logs),
                self._analyze_pros_cons(chunks, logs),
                self._analyze_economic_impact(chunks, logs),
                self._analyze_risk_assessment(chunks, logs),
                self._analyze_global_impact(chunks, logs),
                self._analyze_stakeholders(chunks, logs),
                self._analyze_esg_impact(chunks, logs),
                self._analyze_compliance_burden(chunks, logs),
                self._analyze_legal_precedents(chunks, logs)
            ]

            # Execute section calls sequentially to avoid Gemini burst-rate 429s.
            results = []
            for task in analysis_tasks:
                try:
                    results.append(await task)
                except Exception as exc:
                    results.append(exc)
            logs.append("✓ Aggregating and synthesizing results...")
            
            # Step 5: Parallel analysis for deep sections
            timeline_task = self._analyze_timeline(chunks, metadata, logs)
            comparative_task = self._analyze_comparatives(chunks, metadata, logs)

            # Keep these sequential too for the same quota reason.
            deep_results = []
            for task in (timeline_task, comparative_task):
                try:
                    deep_results.append(await task)
                except Exception as exc:
                    deep_results.append(exc)
            
            # Step 6: Synthesize final results
            final_analysis = self._synthesize_results(metadata, results, deep_results, logs)
            logs.append("✓ Final synthesis complete!")

            final_analysis["analysis_provider"] = self.provider
            final_analysis["analysis_model"] = self.gemini_model if self.provider == "gemini" else "none"
            
            return final_analysis, logs
            
        except Exception as e:
            logger.error(f"Bill analysis provider error: {str(e)}")
            logs.append(f"✗ Provider error: {str(e)}")
            return await self._mock_analysis(text, logs)

    async def _analyze_unified(self, chunks: list[str], metadata: dict, logs: list[str]) -> dict:
        """Run a single comprehensive analysis call to reduce rate-limit risk."""

        joined_chunks = "\n---\n".join(chunks[:min(3, len(chunks))])
        prompt = f"""Analyze this bill and return a complete structured assessment.

Bill title hint: {metadata.get('bill_title', 'Unknown')}
Country hint: {metadata.get('country', 'Unknown')}

Bill content excerpt:
{joined_chunks[:12000]}

Return ONLY valid JSON with these keys:
{{
    "bill_summary": "string",
    "pros": ["string", ...],
    "cons": ["string", ...],
    "national_impact": {{
        "gdp_impact": float,
        "employment_impact": float,
        "inflation_impact": float,
        "sector_effects": [{{"sector": "string", "impact": float}}]
    }},
    "global_impact": {{
        "trade_relations": ["string", ...],
        "geopolitical_influence": float,
        "affected_regions": ["string", ...]
    }},
    "risk_assessment": {{
        "risk_level": "LOW|MEDIUM|HIGH",
        "probability": float,
        "mitigation_strategies": ["string", ...]
    }},
    "stakeholder_analysis": [{{"stakeholder": "string", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL|MIXED", "influence": float}}],
    "implementation_timeline": [{{"phase": "string", "duration": "string", "milestones": ["string", ...]}}],
    "comparative_analysis": [{{"country": "string", "similar_bill": "string", "outcome": "string"}}],
    "esg_impact": {{
        "esg_score": float,
        "environmental": "string",
        "social": "string",
        "governance": "string",
        "sustainability_metrics": ["string", ...]
    }},
    "compliance_burden": {{
        "complexity_score": float,
        "estimated_cost_level": "LOW|MEDIUM|HIGH",
        "burdensome_provisions": ["string", ...],
        "required_resources": ["string", ...]
    }},
    "legal_precedents": {{
        "precedents": [{{"act_name": "string", "outcome": "string", "relevance": "string"}}],
        "legal_challenges_risk": "string"
    }}
}}"""

        try:
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            summary = str(data.get("bill_summary") or "").strip()
            if not summary:
                return {}
            if not isinstance(data.get("pros"), list):
                data["pros"] = []
            if not isinstance(data.get("cons"), list):
                data["cons"] = []
            logs.append("✓ Unified Gemini response parsed")
            return data
        except Exception as e:
            logs.append(f"⚠ Unified analysis fallback used: {str(e)}")
            return {}

    def _merge_unified_analysis(self, metadata: dict, unified: dict) -> dict:
        """Normalize unified response to frontend-compatible schema."""

        analysis = {
            "bill_title": metadata.get("bill_title", "Bill Analysis"),
            "country": metadata.get("country", "Unknown"),
            "bill_summary": unified.get("bill_summary", ""),
            "pros": unified.get("pros", []) if isinstance(unified.get("pros"), list) else [],
            "cons": unified.get("cons", []) if isinstance(unified.get("cons"), list) else [],
            "national_impact": unified.get("national_impact", {}) if isinstance(unified.get("national_impact"), dict) else {},
            "global_impact": unified.get("global_impact", {}) if isinstance(unified.get("global_impact"), dict) else {},
            "risk_assessment": unified.get("risk_assessment", {}) if isinstance(unified.get("risk_assessment"), dict) else {},
            "stakeholder_analysis": unified.get("stakeholder_analysis", []) if isinstance(unified.get("stakeholder_analysis"), list) else [],
            "implementation_timeline": unified.get("implementation_timeline", []) if isinstance(unified.get("implementation_timeline"), list) else [],
            "comparative_analysis": unified.get("comparative_analysis", []) if isinstance(unified.get("comparative_analysis"), list) else [],
            "india_impact": {},
            "recommendations": [],
            "policy_brief": {},
            "esg_impact": unified.get("esg_impact", {}) if isinstance(unified.get("esg_impact"), dict) else {},
            "compliance_burden": unified.get("compliance_burden", {}) if isinstance(unified.get("compliance_burden"), dict) else {},
            "legal_precedents": unified.get("legal_precedents", {}) if isinstance(unified.get("legal_precedents"), dict) else {},
        }

        if not analysis["implementation_timeline"]:
            analysis["implementation_timeline"] = self._generate_timeline()
        if not analysis["comparative_analysis"]:
            analysis["comparative_analysis"] = self._generate_comparatives()

        india_impact = self._build_india_impact(analysis)
        recommendations = self._build_recommendations(analysis, india_impact)
        policy_brief = self._build_policy_brief(analysis, india_impact, recommendations)

        analysis["india_impact"] = india_impact
        analysis["recommendations"] = recommendations
        analysis["policy_brief"] = policy_brief
        return analysis
    
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
            response = await self._call_llm_api(prompt)
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
            response = await self._call_llm_api(prompt)
            return self._extract_json(response)
        except Exception as e:
            logger.warning(f"Summary analysis failed: {str(e)}")
            logs.append(f"⚠ Summary section fallback used: {str(e)}")
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
            response = await self._call_llm_api(prompt)
            return self._extract_json(response)
        except Exception as e:
            logger.warning(f"Pros/cons analysis failed: {str(e)}")
            logs.append(f"⚠ Pros/cons section fallback used: {str(e)}")
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
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            return {"national_impact": data}
        except Exception as e:
            logger.warning(f"Economic impact analysis failed: {str(e)}")
            logs.append(f"⚠ Economic impact section fallback used: {str(e)}")
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
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            return {"risk_assessment": data}
        except Exception as e:
            logger.warning(f"Risk assessment failed: {str(e)}")
            logs.append(f"⚠ Risk assessment section fallback used: {str(e)}")
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
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            return {"global_impact": data}
        except Exception as e:
            logger.warning(f"Global impact analysis failed: {str(e)}")
            logs.append(f"⚠ Global impact section fallback used: {str(e)}")
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
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            return {"stakeholder_analysis": data.get("stakeholders", [])}
        except Exception as e:
            logger.warning(f"Stakeholder analysis failed: {str(e)}")
            logs.append(f"⚠ Stakeholder section fallback used: {str(e)}")
            return {"stakeholder_analysis": []}
    
    async def _analyze_timeline(self, chunks: list, metadata: dict, logs: list) -> list:
        """Analyze and generate a realistic implementation timeline"""
        
        prompt = f"""Based on the provisions in this bill ({metadata.get('bill_title')}), generate a realistic implementation timeline.
        
        Return ONLY valid JSON:
        {{
            "timeline": [
                {{"phase": "string", "duration": "string", "milestones": ["string", ...]}},
                ...
            ]
        }}"""
        
        try:
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            return data.get("timeline", [])
        except Exception as e:
            logger.warning(f"Timeline analysis failed: {str(e)}")
            logs.append(f"⚠ Timeline section fallback used: {str(e)}")
            return self._generate_timeline()

    async def _analyze_comparatives(self, chunks: list, metadata: dict, logs: list) -> list:
        """Analyze and identify similar global legislation for comparative analysis"""
        
        prompt = f"""Compare this bill ({metadata.get('bill_title')}) with similar legislation in other countries.
        
        Return ONLY valid JSON:
        {{
            "comparatively": [
                {{"country": "string", "similar_bill": "string", "outcome": "string"}},
                ...
            ]
        }}"""
        
        try:
            response = await self._call_llm_api(prompt)
            data = self._extract_json(response)
            return data.get("comparatively", [])
        except Exception as e:
            logger.warning(f"Comparative analysis failed: {str(e)}")
            logs.append(f"⚠ Comparative section fallback used: {str(e)}")
            return self._generate_comparatives()

    async def _analyze_esg_impact(self, chunks: list, logs: list) -> dict:
        """Analyze Environmental, Social, and Governance impact"""
        analysis_chunks = chunks[::max(1, len(chunks)//4)]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Assess the ESG (Environmental, Social, and Governance) impact of this legislation:
        {chunk_text[:5000]}
        
        Return ONLY valid JSON:
        {{
            "esg_score": float 0-100,
            "environmental": "string summary",
            "social": "string summary",
            "governance": "string summary",
            "sustainability_metrics": ["string", ...]
        }}"""
        try:
            response = await self._call_llm_api(prompt)
            return {"esg_impact": self._extract_json(response)}
        except Exception as e:
            logs.append(f"⚠ ESG section fallback used: {str(e)}")
            return {"esg_impact": {}}

    async def _analyze_compliance_burden(self, chunks: list, logs: list) -> dict:
        """Analyze compliance burden and implementation costs"""
        analysis_chunks = chunks[len(chunks)//4:len(chunks)//2]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Estimate the compliance burden and cost of this legislation:
        {chunk_text[:5000]}
        
        Return ONLY valid JSON:
        {{
            "complexity_score": float 0-1,
            "estimated_cost_level": "LOW|MEDIUM|HIGH",
            "burdensome_provisions": ["string", ...],
            "required_resources": ["string", ...]
        }}"""
        try:
            response = await self._call_llm_api(prompt)
            return {"compliance_burden": self._extract_json(response)}
        except Exception as e:
            logs.append(f"⚠ Compliance section fallback used: {str(e)}")
            return {"compliance_burden": {}}

    async def _analyze_legal_precedents(self, chunks: list, logs: list) -> dict:
        """Search for similar legal precedents or similar acts"""
        analysis_chunks = chunks[:min(3, len(chunks))]
        chunk_text = "\n---\n".join(analysis_chunks)
        
        prompt = f"""Research legal precedents or similar existing acts for this bill:
        {chunk_text[:5000]}
        
        Return ONLY valid JSON:
        {{
            "precedents": [
                {{"act_name": "string", "outcome": "string", "relevance": "string"}},
                ...
            ],
            "legal_challenges_risk": "string"
        }}"""
        try:
            response = await self._call_llm_api(prompt)
            return {"legal_precedents": self._extract_json(response)}
        except Exception as e:
            logs.append(f"⚠ Legal precedents fallback used: {str(e)}")
            return {"legal_precedents": []}

    async def _call_llm_api(self, prompt: str) -> str:
        """Call configured LLM provider."""
        return await self._call_gemini_api(prompt)

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

    async def _call_gemini_api(self, prompt: str) -> str:
        """Call Gemini API with retry logic."""

        payload_with_json_mime = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "You are a legislative analysis expert. Return ONLY valid JSON.\n\n" + prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens,
                "responseMimeType": "application/json"
            }
        }

        payload_without_mime = {
            "contents": payload_with_json_mime["contents"],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens,
            }
        }

        url = f"{self.gemini_api_base_url}/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    for payload in (payload_with_json_mime, payload_without_mime):
                        response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                        if response.status_code >= 400:
                            # Some preview models reject responseMimeType=json; retry same attempt without it.
                            if payload is payload_with_json_mime:
                                continue
                            response.raise_for_status()

                        result = response.json()
                        candidates = result.get("candidates", [])
                        if not candidates:
                            continue

                        parts = candidates[0].get("content", {}).get("parts", [])
                        if not parts:
                            continue

                        text = "".join(part.get("text", "") for part in parts)
                        if text and text.strip():
                            return text

                    raise Exception("Gemini response has no usable candidate text")

            except httpx.TimeoutException:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Gemini API timeout, retrying... (attempt {attempt + 1})")
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
            except httpx.HTTPStatusError as e:
                if e.response is not None and e.response.status_code == 429 and attempt < self.max_retries - 1:
                    retry_after = e.response.headers.get("Retry-After")
                    wait_seconds = float(retry_after) if retry_after and retry_after.isdigit() else 6.0 * (attempt + 1)
                    logger.warning(f"Gemini API rate-limited (429), waiting {wait_seconds:.1f}s before retry")
                    await asyncio.sleep(wait_seconds)
                    continue
                if attempt < self.max_retries - 1:
                    logger.warning(f"Gemini API HTTP error: {str(e)}, retrying...")
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
            except Exception as e:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Gemini API error: {str(e)}, retrying...")
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise

        raise Exception("Max retries exceeded")

    async def _upload_pdf_to_gemini(self, pdf_bytes: bytes, filename: str) -> tuple[str, str]:
        """Upload PDF bytes to Gemini File API and return (file_name, file_uri)."""

        host = self.gemini_api_base_url.rstrip("/")
        if host.endswith("/v1beta"):
            host = host[:-7]
        elif host.endswith("/v1"):
            host = host[:-3]

        upload_url = f"{host}/upload/v1beta/files?key={self.gemini_api_key}"
        headers = {
            "X-Goog-Upload-Protocol": "multipart",
            "X-Goog-Upload-Command": "start, upload, finalize",
            "X-Goog-Upload-Header-Content-Type": "application/pdf",
            "X-Goog-Upload-Header-Content-Length": str(len(pdf_bytes)),
        }

        files = {
            "metadata": (None, json.dumps({"file": {"displayName": filename}}), "application/json"),
            "file": (filename, pdf_bytes, "application/pdf"),
        }

        async with httpx.AsyncClient(timeout=max(120.0, float(self.timeout))) as client:
            response = await client.post(upload_url, headers=headers, files=files)
            response.raise_for_status()
            payload = response.json()

        file_data = payload.get("file") or {}
        file_name = file_data.get("name")
        file_uri = file_data.get("uri")
        if not file_name or not file_uri:
            raise ValueError("File upload succeeded but response did not contain file name/uri")
        return file_name, file_uri

    async def _delete_uploaded_file(self, file_name: str) -> None:
        """Best-effort cleanup for uploaded Gemini files."""

        try:
            delete_url = f"{self.gemini_api_base_url.rstrip('/')}/{file_name}?key={self.gemini_api_key}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.delete(delete_url)
        except Exception:
            logger.debug("Gemini file cleanup skipped", exc_info=True)

    async def _call_gemini_comprehensive(self, file_uri: str) -> dict[str, Any]:
        """Single-pass comprehensive analysis using Gemini response schema."""

        response_schema: dict[str, Any] = {
            "type": "OBJECT",
            "properties": {
                "bill_title": {"type": "STRING"},
                "country": {"type": "STRING"},
                "bill_summary": {"type": "STRING"},
                "pros": {"type": "ARRAY", "items": {"type": "STRING"}},
                "cons": {"type": "ARRAY", "items": {"type": "STRING"}},
                "national_impact": {
                    "type": "OBJECT",
                    "properties": {
                        "gdp_impact": {"type": "NUMBER"},
                        "employment_impact": {"type": "NUMBER"},
                        "inflation_impact": {"type": "NUMBER"},
                        "sector_effects": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "sector": {"type": "STRING"},
                                    "impact": {"type": "NUMBER"},
                                },
                            },
                        },
                    },
                },
                "global_impact": {
                    "type": "OBJECT",
                    "properties": {
                        "trade_relations": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "geopolitical_influence": {"type": "NUMBER"},
                        "affected_regions": {"type": "ARRAY", "items": {"type": "STRING"}},
                    },
                },
                "risk_assessment": {
                    "type": "OBJECT",
                    "properties": {
                        "risk_level": {"type": "STRING", "enum": ["LOW", "MEDIUM", "HIGH"]},
                        "probability": {"type": "NUMBER"},
                        "mitigation_strategies": {"type": "ARRAY", "items": {"type": "STRING"}},
                    },
                },
                "stakeholder_analysis": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "stakeholder": {"type": "STRING"},
                            "sentiment": {"type": "STRING", "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"]},
                            "influence": {"type": "NUMBER"},
                        },
                    },
                },
                "implementation_timeline": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "phase": {"type": "STRING"},
                            "duration": {"type": "STRING"},
                            "milestones": {"type": "ARRAY", "items": {"type": "STRING"}},
                        },
                    },
                },
                "comparative_analysis": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "country": {"type": "STRING"},
                            "similar_bill": {"type": "STRING"},
                            "outcome": {"type": "STRING"},
                        },
                    },
                },
                "india_impact": {
                    "type": "OBJECT",
                    "properties": {
                        "regional_signal_strength": {"type": "NUMBER"},
                        "inflation_pressure": {"type": "NUMBER"},
                        "readiness_score": {"type": "NUMBER"},
                        "opportunity_index": {"type": "NUMBER"},
                    },
                },
                "recommendations": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "detail": {"type": "STRING"},
                            "confidence": {"type": "NUMBER"},
                            "priority": {"type": "STRING", "enum": ["low", "medium", "high"]},
                        },
                    },
                },
                "esg_impact": {
                    "type": "OBJECT",
                    "properties": {
                        "esg_score": {"type": "NUMBER"},
                        "environmental": {"type": "STRING"},
                        "social": {"type": "STRING"},
                        "governance": {"type": "STRING"},
                        "sustainability_metrics": {"type": "ARRAY", "items": {"type": "STRING"}},
                    },
                },
                "compliance_burden": {
                    "type": "OBJECT",
                    "properties": {
                        "complexity_score": {"type": "NUMBER"},
                        "estimated_cost_level": {"type": "STRING", "enum": ["LOW", "MEDIUM", "HIGH"]},
                        "burdensome_provisions": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "required_resources": {"type": "ARRAY", "items": {"type": "STRING"}},
                    },
                },
                "legal_precedents": {
                    "type": "OBJECT",
                    "properties": {
                        "precedents": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "act_name": {"type": "STRING"},
                                    "outcome": {"type": "STRING"},
                                    "relevance": {"type": "STRING"},
                                },
                            },
                        },
                        "legal_challenges_risk": {"type": "STRING"},
                    },
                },
            },
            "required": [
                "bill_title",
                "country",
                "bill_summary",
                "pros",
                "cons",
                "national_impact",
                "global_impact",
                "risk_assessment",
                "stakeholder_analysis",
                "implementation_timeline",
                "comparative_analysis",
                "india_impact",
                "recommendations",
            ],
        }

        payload_base = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are an expert legislative analyst. Read the entire attached PDF and produce a rigorous,"
                            " evidence-driven assessment. Do not use placeholders. Return strict JSON only."
                        )
                    }
                ]
            },
            "contents": [
                {
                    "parts": [
                        {
                            "fileData": {
                                "mimeType": "application/pdf",
                                "fileUri": file_uri,
                            }
                        },
                        {
                            "text": "Analyze this legislative document holistically and provide the complete structured response."
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": min(0.2, float(self.temperature)),
                "maxOutputTokens": min(3072, int(self.max_tokens)),
                "responseMimeType": "application/json",
                "responseSchema": response_schema,
            },
        }

        candidate_models = [self.gemini_model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        seen_models: set[str] = set()

        last_error: Optional[Exception] = None

        for model_name in candidate_models:
            if not model_name or model_name in seen_models:
                continue
            seen_models.add(model_name)
            url = f"{self.gemini_api_base_url.rstrip('/')}/models/{model_name}:generateContent?key={self.gemini_api_key}"

            for attempt in range(self.max_retries):
                try:
                    async with httpx.AsyncClient(timeout=max(180.0, float(self.timeout))) as client:
                        response = await client.post(url, json=payload_base, headers={"Content-Type": "application/json"})
                        response.raise_for_status()
                        result = response.json()
                        text = "".join(
                            part.get("text", "")
                            for part in ((result.get("candidates", [{}])[0].get("content", {}) or {}).get("parts", []))
                        )
                        data = self._extract_json(text)
                        if not data:
                            raise ValueError("Gemini structured response was empty")
                        return data
                except httpx.HTTPStatusError as e:
                    last_error = e
                    if e.response is not None and e.response.status_code == 429 and attempt < self.max_retries - 1:
                        retry_after = e.response.headers.get("Retry-After")
                        wait_seconds = float(retry_after) if retry_after and retry_after.isdigit() else 10.0 * (attempt + 1)
                        logger.warning(f"Gemini model {model_name} rate-limited (429), waiting {wait_seconds:.1f}s")
                        await asyncio.sleep(wait_seconds)
                        continue
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    break
                except Exception as e:
                    last_error = e
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    break

            logger.warning(f"Gemini comprehensive analysis failed for model {model_name}; trying next model")

        raise Exception(f"Gemini comprehensive call exceeded retry budget across models: {last_error}")

    def _normalize_holistic_analysis(self, data: dict[str, Any], filename: str) -> dict[str, Any]:
        """Normalize holistic response into the expected frontend schema."""

        analysis: dict[str, Any] = {
            "bill_title": data.get("bill_title") or filename or "Bill Analysis",
            "country": data.get("country") or "Unknown",
            "bill_summary": data.get("bill_summary") or "",
            "pros": data.get("pros") if isinstance(data.get("pros"), list) else [],
            "cons": data.get("cons") if isinstance(data.get("cons"), list) else [],
            "national_impact": data.get("national_impact") if isinstance(data.get("national_impact"), dict) else {},
            "global_impact": data.get("global_impact") if isinstance(data.get("global_impact"), dict) else {},
            "risk_assessment": data.get("risk_assessment") if isinstance(data.get("risk_assessment"), dict) else {},
            "stakeholder_analysis": data.get("stakeholder_analysis") if isinstance(data.get("stakeholder_analysis"), list) else [],
            "implementation_timeline": data.get("implementation_timeline") if isinstance(data.get("implementation_timeline"), list) else [],
            "comparative_analysis": data.get("comparative_analysis") if isinstance(data.get("comparative_analysis"), list) else [],
            "india_impact": data.get("india_impact") if isinstance(data.get("india_impact"), dict) else {},
            "recommendations": data.get("recommendations") if isinstance(data.get("recommendations"), list) else [],
            "policy_brief": data.get("policy_brief") if isinstance(data.get("policy_brief"), dict) else {},
            "esg_impact": data.get("esg_impact") if isinstance(data.get("esg_impact"), dict) else {},
            "compliance_burden": data.get("compliance_burden") if isinstance(data.get("compliance_burden"), dict) else {},
            "legal_precedents": data.get("legal_precedents") if isinstance(data.get("legal_precedents"), dict) else {},
        }

        if not analysis["implementation_timeline"]:
            analysis["implementation_timeline"] = self._generate_timeline()
        if not analysis["comparative_analysis"]:
            analysis["comparative_analysis"] = self._generate_comparatives()

        if not analysis["india_impact"]:
            analysis["india_impact"] = self._build_india_impact(analysis)
        if not analysis["recommendations"]:
            analysis["recommendations"] = self._build_recommendations(analysis, analysis["india_impact"])
        if not analysis["policy_brief"]:
            analysis["policy_brief"] = self._build_policy_brief(
                analysis,
                analysis["india_impact"],
                analysis["recommendations"],
            )

        return analysis
    
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

        if not response:
            return {}

        candidate = response.strip()

        # Remove markdown code fences if the model wrapped JSON in ```json ... ```.
        candidate = re.sub(r"^```(?:json)?\s*", "", candidate, flags=re.IGNORECASE)
        candidate = re.sub(r"\s*```$", "", candidate)

        # Try direct parse first.
        try:
            parsed = json.loads(candidate)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            pass

        # Fallback: find largest JSON object region.
        start_idx = candidate.find("{")
        end_idx = candidate.rfind("}") + 1
        if start_idx < 0 or end_idx <= start_idx:
            return {}

        json_str = candidate[start_idx:end_idx]

        # Repair a common model issue: trailing commas before ] or }.
        json_str = re.sub(r",\s*([}\]])", r"\1", json_str)

        try:
            parsed = json.loads(json_str)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            logger.warning("JSON parsing failed after repair, returning empty dict")
            return {}
    
    def _synthesize_results(self, metadata: dict, results: list, deep_results: list, logs: list) -> dict:
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
            "implementation_timeline": [],
            "comparative_analysis": [],
            "india_impact": {},
            "recommendations": [],
            "policy_brief": {},
            "esg_impact": {},
            "compliance_burden": {},
            "legal_precedents": {}
        }
        
        # Merge basic parallel results
        for result in results:
            if isinstance(result, Exception):
                continue
            if isinstance(result, dict):
                analysis.update(result)
        
        # Merge deep results (timeline, comparatives)
        if len(deep_results) >= 2:
            if not isinstance(deep_results[0], Exception):
                analysis["implementation_timeline"] = deep_results[0]
            if not isinstance(deep_results[1], Exception):
                analysis["comparative_analysis"] = deep_results[1]
        
        if not analysis["implementation_timeline"]:
            analysis["implementation_timeline"] = self._generate_timeline()
        if not analysis["comparative_analysis"]:
            analysis["comparative_analysis"] = self._generate_comparatives()

        india_impact = self._build_india_impact(analysis)
        recommendations = self._build_recommendations(analysis, india_impact)
        policy_brief = self._build_policy_brief(analysis, india_impact, recommendations)

        analysis["india_impact"] = india_impact
        analysis["recommendations"] = recommendations
        analysis["policy_brief"] = policy_brief
        
        return analysis

    def _build_india_impact(self, analysis: dict) -> dict:
        """Derive India-focused impact metrics from analysis output."""

        insight_pool = " ".join([
            analysis.get("bill_summary", "") or "",
            *(analysis.get("pros", []) or []),
            *(analysis.get("cons", []) or []),
            *(analysis.get("global_impact", {}).get("trade_relations", []) or []),
            *(analysis.get("global_impact", {}).get("affected_regions", []) or []),
            *(analysis.get("risk_assessment", {}).get("mitigation_strategies", []) or []),
            *[
                f"{item.get('country', '')} {item.get('outcome', '')}" for item in (analysis.get("comparative_analysis", []) or [])
                if isinstance(item, dict)
            ],
        ])

        lower_text = insight_pool.lower()

        india_mentions = lower_text.count("india")
        south_asia_terms = ["pakistan", "bangladesh", "nepal", "sri lanka", "bhutan", "maldives"]
        south_asia_mentions = sum(lower_text.count(term) for term in south_asia_terms)

        national_impact = analysis.get("national_impact", {}) or {}
        risk_assessment = analysis.get("risk_assessment", {}) or {}
        global_impact = analysis.get("global_impact", {}) or {}

        inflation_impact = float(national_impact.get("inflation_impact", 0) or 0)
        employment_impact = float(national_impact.get("employment_impact", 0) or 0)
        gdp_impact = float(national_impact.get("gdp_impact", 0) or 0)
        risk_probability = float(risk_assessment.get("probability", 0) or 0)
        geopolitical_influence = float(global_impact.get("geopolitical_influence", 0) or 0)
        timeline_depth = len(analysis.get("implementation_timeline", []) or [])

        regional_signal_strength = min(100, india_mentions * 18 + south_asia_mentions * 9)
        inflation_pressure = min(100, abs(inflation_impact) * 22)
        employment_momentum = max(0, min(100, 50 + employment_impact * 24))
        readiness_score = max(
            0,
            min(100, 100 - risk_probability * 55 - abs(inflation_impact) * 7 + timeline_depth * 4)
        )
        opportunity_index = max(
            0,
            min(
                100,
                (len(analysis.get("pros", []) or []) * 6)
                - (len(analysis.get("cons", []) or []) * 3)
                + max(0, gdp_impact) * 18
                + max(0, employment_impact) * 14
                + geopolitical_influence * 12,
            ),
        )

        return {
            "regional_signal_strength": round(regional_signal_strength, 2),
            "india_mentions": india_mentions,
            "south_asia_mentions": south_asia_mentions,
            "inflation_pressure": round(inflation_pressure, 2),
            "employment_momentum": round(employment_momentum, 2),
            "readiness_score": round(readiness_score, 2),
            "opportunity_index": round(opportunity_index, 2),
        }

    def _build_recommendations(self, analysis: dict, india_impact: dict) -> list[dict]:
        """Generate recommendation objects that frontend can render directly."""

        risk_probability = float((analysis.get("risk_assessment", {}) or {}).get("probability", 0) or 0)
        readiness_score = float(india_impact.get("readiness_score", 0) or 0)
        inflation_pressure = float(india_impact.get("inflation_pressure", 0) or 0)
        regional_signal_strength = float(india_impact.get("regional_signal_strength", 0) or 0)

        recommendations = [
            {
                "title": "Run staged rollout before national adoption" if readiness_score < 45 else "Proceed with controlled phased rollout",
                "detail": "High implementation volatility detected. Pilot first and enforce milestone gates." if readiness_score < 45 else "Execution profile is stable enough for phase-led national implementation.",
                "confidence": round(max(0, min(100, 100 - risk_probability * 35)), 2),
                "priority": "high" if readiness_score < 45 else "medium",
            },
            {
                "title": "Add inflation guardrails in amendment language" if inflation_pressure > 45 else "Maintain monetary neutrality clauses",
                "detail": "Current signal suggests inflation-side risk. Add time-bound subsidies or tax dampeners." if inflation_pressure > 45 else "Inflation pressure appears manageable; preserve stability provisions.",
                "confidence": round(max(0, min(100, 70 + min(20, inflation_pressure / 3))), 2),
                "priority": "high" if inflation_pressure > 45 else "low",
            },
            {
                "title": "Prioritize India regional diplomacy track" if regional_signal_strength > 35 else "Keep regional engagement as a monitoring channel",
                "detail": "Detected strong India/South Asia signal density across impact narrative and trade references." if regional_signal_strength > 35 else "Regional impact appears moderate; maintain strategic watch with periodic review.",
                "confidence": round(max(0, min(100, 65 + min(30, regional_signal_strength / 3))), 2),
                "priority": "medium",
            },
        ]

        return recommendations

    def _build_policy_brief(self, analysis: dict, india_impact: dict, recommendations: list[dict]) -> dict:
        """Build a compact, PDF-ready policy brief payload."""

        risk_assessment = analysis.get("risk_assessment", {}) or {}
        national_impact = analysis.get("national_impact", {}) or {}
        global_impact = analysis.get("global_impact", {}) or {}

        top_recommendations = [item.get("title", "") for item in recommendations[:3] if isinstance(item, dict)]

        return {
            "executive_summary": analysis.get("bill_summary", ""),
            "core_metrics": {
                "gdp_impact": national_impact.get("gdp_impact", 0),
                "employment_impact": national_impact.get("employment_impact", 0),
                "inflation_impact": national_impact.get("inflation_impact", 0),
                "risk_level": risk_assessment.get("risk_level", "MEDIUM"),
                "risk_probability": risk_assessment.get("probability", 0),
                "geopolitical_influence": global_impact.get("geopolitical_influence", 0),
                "india_readiness": india_impact.get("readiness_score", 0),
            },
            "top_recommendations": top_recommendations,
            "next_90_days": [
                "Finalize implementation governance and ownership matrix",
                "Launch pilot execution in high-readiness sectors",
                "Publish inflation and employment monitoring cadence",
            ],
        }
    
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
        
        analysis = {
            "bill_title": "Legislative Analysis",
            "country": "Unknown",
            "bill_summary": f"This document contains approximately {word_count} words. Full AI-powered analysis requires GEMINI_API_KEY configuration.",
            "analysis_provider": "mock",
            "analysis_model": "none",
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
        }

        india_impact = self._build_india_impact(analysis)
        recommendations = self._build_recommendations(analysis, india_impact)
        policy_brief = self._build_policy_brief(analysis, india_impact, recommendations)

        analysis["india_impact"] = india_impact
        analysis["recommendations"] = recommendations
        analysis["policy_brief"] = policy_brief

        return analysis, logs
