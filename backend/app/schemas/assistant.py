from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.product import ProductResponse

class VoiceCommandRequest(BaseModel):
    command: str
    current_product_id: Optional[int] = None
    session_id: Optional[str] = None

class ExtractedEntities(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sort_by: Optional[str] = None  # "price_asc", "price_desc", "rating_desc", "newest"
    keyword: Optional[str] = None
    product_name: Optional[str] = None
    target_product_id: Optional[int] = None
    item_index: Optional[int] = None
    compare_terms: Optional[List[str]] = None

class VoiceCommandResponse(BaseModel):
    transcript: str
    intent: str
    entities: ExtractedEntities
    spoken_response: str
    display_response: str
    action: str  # "SEARCH_RESULTS", "CART_UPDATED", "CART_TOTAL", "COMPARE", "NAVIGATE", "MESSAGE"
    action_data: Optional[Dict[str, Any]] = None
    products: Optional[List[ProductResponse]] = None

class RecommendationRequest(BaseModel):
    category_slug: Optional[str] = None
    budget: Optional[float] = None
    current_product_id: Optional[int] = None
    limit: int = 6

class ComparisonRequest(BaseModel):
    product_ids: List[int]

class ComparisonFeatureRow(BaseModel):
    feature_name: str
    values: Dict[int, str]  # product_id -> string value

class ProductComparisonResponse(BaseModel):
    products: List[ProductResponse]
    features: List[ComparisonFeatureRow]
    verdict: str
    better_value_product_id: Optional[int]
    spoken_summary: str

