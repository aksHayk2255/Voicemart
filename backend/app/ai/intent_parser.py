import re
from typing import Dict, Any, Optional, List, Tuple

CATEGORY_SYNONYMS = {
    "Smartphones": [
        "smartphone", "smartphones", "phone", "phones", "mobile", "mobiles", 
        "cellphone", "cellphones", "iphone", "galaxy"
    ],
    "Laptops": [
        "laptop", "laptops", "notebook", "notebooks", "macbook", "computer", "computers"
    ],
    "Headphones": [
        "headphone", "headphones", "earphone", "earphones", "earbuds", "earbud",
        "airpods", "headset", "headsets", "tws", "ear piece"
    ],
    "Smartwatches": [
        "smartwatch", "smartwatches", "watch", "watches", "fitness band", "tracker",
        "apple watch", "galaxy watch"
    ],
    "Accessories": [
        "accessory", "accessories", "mouse", "keyboard", "charger", "power bank", 
        "hub", "adapter", "ssd", "cable"
    ],
    "Electronics": [
        "electronic", "electronics", "monitor", "display", "screen", "camera", 
        "soundbar", "speaker", "router", "echo dot", "smart home"
    ]
}

KNOWN_BRANDS = [
    "Apple", "Samsung", "Dell", "ASUS", "HP", "Lenovo", "Acer", "Sony", 
    "boAt", "Bose", "Sennheiser", "Noise", "Fire-Boltt", "Garmin", "Amazfit", 
    "Logitech", "Keychron", "Anker", "SanDisk", "Baseus", "LG", "Amazon", 
    "TP-Link", "Crucial", "Xiaomi", "Redmi", "OnePlus", "Google"
]

ORDINAL_MAP = {
    "first": 0, "1st": 0, "one": 0,
    "second": 1, "2nd": 1, "two": 1,
    "third": 2, "3rd": 2, "three": 2,
    "fourth": 3, "4th": 3, "four": 3,
    "last": -1
}

class NLPIntentParser:
    """Rule-based, high-accuracy NLP intent and entity extractor."""

    @classmethod
    def parse(cls, text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        text_clean = text.strip()
        lower = text_clean.lower()

        # 1. Check Cart total or view cart
        if cls._is_check_cart(lower):
            return {
                "intent": "CHECK_CART",
                "entities": {},
                "raw_text": text_clean
            }

        # 2. Add to cart
        if cls._is_add_to_cart(lower):
            product_target = cls._extract_product_reference(text_clean, lower)
            return {
                "intent": "ADD_TO_CART",
                "entities": {
                    "product_name": product_target,
                    "target_product_id": context.get("current_product_id") if context else None
                },
                "raw_text": text_clean
            }

        # 3. Remove from cart
        if cls._is_remove_from_cart(lower):
            idx = cls._extract_ordinal(lower)
            return {
                "intent": "REMOVE_FROM_CART",
                "entities": {
                    "item_index": idx
                },
                "raw_text": text_clean
            }

        # 4. Compare products
        if cls._is_compare(lower):
            terms = cls._extract_comparison_terms(text_clean, lower)
            return {
                "intent": "COMPARE_PRODUCTS",
                "entities": {
                    "compare_terms": terms
                },
                "raw_text": text_clean
            }

        # 5. Extract category, brand, price limits, sort
        category = cls._extract_category(lower)
        brand = cls._extract_brand(lower)
        min_p, max_p = cls._extract_price_range(lower)
        sort_by = cls._extract_sorting(lower)

        # Determine if it's FILTER_PRODUCT, SORT_PRODUCT or SEARCH_PRODUCT
        has_filter = (category is not None) or (brand is not None) or (min_p is not None) or (max_p is not None)
        
        if sort_by and not has_filter and not any(kw in lower for kw in ["find", "show", "search", "get"]):
            return {
                "intent": "SORT_PRODUCT",
                "entities": {
                    "sort_by": sort_by
                },
                "raw_text": text_clean
            }

        if any(cls._is_general_query(lower)):
            return {
                "intent": "GENERAL_QUERY",
                "entities": {
                    "keyword": text_clean
                },
                "raw_text": text_clean
            }

        # Default to SEARCH_PRODUCT with extracted entities
        return {
            "intent": "SEARCH_PRODUCT",
            "entities": {
                "category": category,
                "brand": brand,
                "min_price": min_p,
                "max_price": max_p,
                "sort_by": sort_by,
                "keyword": cls._clean_search_keywords(text_clean, category, brand, max_p, min_p)
            },
            "raw_text": text_clean
        }

    @staticmethod
    def _is_check_cart(text: str) -> bool:
        triggers = [
            "cart total", "what is my cart total", "what's my cart total", 
            "check cart", "check my cart", "view cart", "view my cart", 
            "show cart", "show my cart", "how much in my cart", "how much is my cart",
            "open cart", "open my cart", "what is in my cart", "items in my cart"
        ]
        return any(t in text for t in triggers)

    @staticmethod
    def _is_add_to_cart(text: str) -> bool:
        triggers = [
            "add to cart", "add to my cart", "put in cart", "put in my cart", 
            "add this product", "add this to cart", "buy this", "add item to cart",
            "add product to cart", "add this"
        ]
        return any(t in text for t in triggers)

    @staticmethod
    def _is_remove_from_cart(text: str) -> bool:
        triggers = [
            "remove from cart", "remove from my cart", "delete from cart", 
            "delete from my cart", "remove the first", "remove the second", 
            "remove the last", "take out from cart", "clear cart", "empty cart"
        ]
        return any(t in text for t in triggers)

    @staticmethod
    def _is_compare(text: str) -> bool:
        return any(k in text for k in ["compare", "vs", "versus", "difference between", "comparison"])

    @staticmethod
    def _is_general_query(text: str) -> bool:
        return [
            text.startswith("who are you"),
            text.startswith("what is voicemart"),
            text.startswith("help"),
            text == "hi" or text == "hello" or text == "hey"
        ]

    @classmethod
    def _extract_category(cls, text: str) -> Optional[str]:
        for cat_name, synonyms in CATEGORY_SYNONYMS.items():
            for syn in synonyms:
                pattern = r'\b' + re.escape(syn) + r'\b'
                if re.search(pattern, text):
                    return cat_name
        return None

    @classmethod
    def _extract_brand(cls, text: str) -> Optional[str]:
        for brand in KNOWN_BRANDS:
            pattern = r'\b' + re.escape(brand.lower()) + r'\b'
            if re.search(pattern, text):
                return brand
        return None

    @staticmethod
    def _extract_price_range(text: str) -> Tuple[Optional[float], Optional[float]]:
        min_price: Optional[float] = None
        max_price: Optional[float] = None

        # Clean "rupees", "rs", "inr", commas
        cleaned = text.replace(",", "").replace("₹", "").replace("rupees", "").replace("rupee", "").replace("rs.", "").replace("rs", "").replace("inr", "")

        # Check "between X and Y"
        between_match = re.search(r'between\s+(\d+(?:\.\d+)?k?)\s+and\s+(\d+(?:\.\d+)?k?)', cleaned)
        if between_match:
            min_val = NLPIntentParser._parse_price_number(between_match.group(1))
            max_val = NLPIntentParser._parse_price_number(between_match.group(2))
            return min_val, max_val

        # Check max price: "under X", "below X", "less than X", "cheaper than X", "within X", "upto X", "up to X", "max X"
        max_match = re.search(r'(?:under|below|less than|cheaper than|within|upto|up to|max(?:imum)?)\s+(\d+(?:\.\d+)?k?)', cleaned)
        if max_match:
            max_price = NLPIntentParser._parse_price_number(max_match.group(1))

        # Check min price: "above X", "more than X", "greater than X", "over X", "at least X", "min X"
        min_match = re.search(r'(?:above|more than|greater than|over|at least|min(?:imum)?)\s+(\d+(?:\.\d+)?k?)', cleaned)
        if min_match:
            min_price = NLPIntentParser._parse_price_number(min_match.group(1))

        return min_price, max_price

    @staticmethod
    def _parse_price_number(val_str: str) -> float:
        val_str = val_str.strip().lower()
        if val_str.endswith("k"):
            num = float(val_str[:-1]) * 1000
            return num
        return float(val_str)

    @staticmethod
    def _extract_sorting(text: str) -> Optional[str]:
        if any(w in text for w in ["cheapest", "lowest price", "least expensive", "low to high", "affordable", "budget friendly"]):
            return "price_asc"
        if any(w in text for w in ["most expensive", "highest price", "high to low", "costliest", "premium"]):
            return "price_desc"
        if any(w in text for w in ["top rated", "highly rated", "best rated", "highest rated", "most rated", "best quality", "best"]):
            return "rating_desc"
        if any(w in text for w in ["latest", "newest", "recently added", "fresh"]):
            return "newest"
        return None

    @staticmethod
    def _extract_ordinal(text: str) -> Optional[int]:
        for ord_word, index_val in ORDINAL_MAP.items():
            pattern = r'\b' + re.escape(ord_word) + r'\b'
            if re.search(pattern, text):
                return index_val
        return 0  # default first item if not specified

    @staticmethod
    def _extract_comparison_terms(text: str, lower: str) -> List[str]:
        # e.g., "Compare Samsung Galaxy S24 and iPhone 15"
        # or "Compare these two products"
        # or "Sony WH-1000XM5 vs AirPods Pro"
        if "vs" in lower or "versus" in lower:
            parts = re.split(r'\b(?:vs|versus)\b', text, flags=re.IGNORECASE)
            if len(parts) >= 2:
                return [p.strip() for p in parts[:2] if p.strip()]

        and_match = re.search(r'compare\s+(.+?)\s+and\s+(.+)', text, re.IGNORECASE)
        if and_match:
            return [and_match.group(1).strip(), and_match.group(2).strip()]

        with_match = re.search(r'compare\s+(.+?)\s+with\s+(.+)', text, re.IGNORECASE)
        if with_match:
            return [with_match.group(1).strip(), with_match.group(2).strip()]

        return []

    @staticmethod
    def _extract_product_reference(text: str, lower: str) -> Optional[str]:
        # "Add Samsung Galaxy S24 to cart" -> "Samsung Galaxy S24"
        m = re.search(r'add\s+(.+?)\s+(?:to my cart|to the cart|to cart)', text, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            if candidate.lower() not in ["this", "this product", "it", "the item", "product"]:
                return candidate
        return None

    @staticmethod
    def _clean_search_keywords(
        text: str, 
        category: Optional[str], 
        brand: Optional[str], 
        max_p: Optional[float], 
        min_p: Optional[float]
    ) -> Optional[str]:
        # Remove helper stop words
        stop_words = [
            "find", "show", "search", "get", "looking", "for", "please", "me", "a", "an", "the",
            "products", "product", "items", "item", "below", "under", "above", "rupees", "rupee",
            "rs", "inr", "cheapest", "best", "rated", "cheap", "expensive", "give", "display", "all",
            "most", "top", "highly"
        ]

        cat_synonyms_flat = []
        if category and category in CATEGORY_SYNONYMS:
            cat_synonyms_flat = [s.lower() for s in CATEGORY_SYNONYMS[category]]

        words = text.split()
        cleaned_words = []
        for w in words:
            clean_w = re.sub(r'[^\w]', '', w).lower()
            if not clean_w:
                continue
            if clean_w in stop_words:
                continue
            if clean_w.isdigit() or (clean_w.endswith('k') and clean_w[:-1].isdigit()):
                continue
            if brand and clean_w == brand.lower():
                continue
            if clean_w in cat_synonyms_flat:
                continue
            cleaned_words.append(w)
        
        result = " ".join(cleaned_words).strip()
        return result if len(result) > 1 else None
