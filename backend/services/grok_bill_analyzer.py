"""Grok API Client for Efficient Bill Analysis - Optimized for 300+ Page Documents"""

import json
import logging
import asyncio
from typing import Optional
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
        
        self.provider = "gemini" if self.gemini_api_key else "grok" if self.api_key else "mock"

        if self.provider == "mock":
            logger.warning("No LLM API key configured (GEMINI_API_KEY/GROK_API_KEY). Using mock analysis mode.")
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
            
            results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
            logs.append("✓ Aggregating and synthesizing results...")
            
            # Step 5: Parallel analysis for deep sections
            timeline_task = self._analyze_timeline(chunks, metadata, logs)
            comparative_task = self._analyze_comparatives(chunks, metadata, logs)
            
            deep_results = await asyncio.gather(timeline_task, comparative_task, return_exceptions=True)
            
            # Step 6: Synthesize final results
            final_analysis = self._synthesize_results(metadata, results, deep_results, logs)
            logs.append("✓ Final synthesis complete!")

            final_analysis["analysis_provider"] = self.provider
            final_analysis["analysis_model"] = self.gemini_model if self.provider == "gemini" else self.model
            
            return final_analysis, logs
            
        except Exception as e:
            logger.error(f"Bill analysis provider error: {str(e)}")
            logs.append(f"✗ Provider error: {str(e)}")
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
        except: return {"esg_impact": {}}

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
        except: return {"compliance_burden": {}}

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
        except: return {"legal_precedents": []}

    async def _call_llm_api(self, prompt: str) -> str:
        """Call configured LLM provider (Gemini preferred, Grok fallback)."""
        if self.provider == "gemini":
            return await self._call_gemini_api(prompt)
        return await self._call_grok_api(prompt)

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

        payload = {
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

        url = f"{self.gemini_api_base_url}/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                    response.raise_for_status()
                    result = response.json()

                    candidates = result.get("candidates", [])
                    if not candidates:
                        raise Exception("Gemini response has no candidates")

                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts:
                        raise Exception("Gemini response has no content parts")

                    text = "".join(part.get("text", "") for part in parts)
                    if not text:
                        raise Exception("Gemini response text is empty")

                    return text

            except httpx.TimeoutException:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Gemini API timeout, retrying... (attempt {attempt + 1})")
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
            "bill_summary": f"This document contains approximately {word_count} words. Full AI-powered analysis requires GEMINI_API_KEY or GROK_API_KEY configuration.",
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
