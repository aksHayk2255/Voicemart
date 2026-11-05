from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.product import ProductResponse

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    discount: float
    total: float
    item_count: int

