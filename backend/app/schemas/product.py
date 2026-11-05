import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    brand: str
    category_id: int
    price: float
    original_price: Optional[float] = None
    description: str
    image_url: str
    stock: int = 50
    is_featured: bool = False
    rating: float = 4.5
    rating_count: int = 50
    specifications: Optional[str] = "{}"  # JSON string

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    specifications: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime.datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    limit: int

