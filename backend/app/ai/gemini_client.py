import os
import json
import logging
import requests
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class GeminiClient:
    """Optional Gemini API integration for advanced intent refinement and conversational answers."""

    @classmethod
    def is_available(cls) -> bool:
        return bool(GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5)

    @classmethod
    def refine_query(cls, user_text: str) -> Optional[Dict[str, Any]]:
        if not cls.is_available():
            return None
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""
You are VoiceMart's shopping assistant. Analyze this voice shopping input: "{user_text}".
Return strict JSON with keys:
- "intent": one of ["SEARCH_PRODUCT", "FILTER_PRODUCT", "SORT_PRODUCT", "ADD_TO_CART", "REMOVE_FROM_CART", "COMPARE_PRODUCTS", "CHECK_CART", "GENERAL_QUERY"]
- "category": category string if mentioned or null
- "brand": brand string if mentioned or null
- "min_price": number or null
- "max_price": number or null
- "sort_by": "price_asc" | "price_desc" | "rating_desc" | null
- "keyword": search terms or null
- "spoken_reply": short polite spoken response suitable for speech synthesis
Only output valid JSON without markdown wrapping.
"""
        try:
            payload = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ],
                "generationConfig": {
                    "response_mime_type": "application/json"
                }
            }
            res = requests.post(url, json=payload, timeout=4)
            if res.status_code == 200:
                data = res.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_content)
        except Exception as e:
            logger.warning(f"Optional Gemini integration skipped: {e}")
        return None

