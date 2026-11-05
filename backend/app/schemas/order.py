import datetime
from typing import List, Optional
from pydantic import BaseModel

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    product_image: Optional[str]
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    shipping_address: str
    payment_method: str = "UPI (Simulated)"

class OrderResponse(BaseModel):
    id: int
    order_number: str
    total_amount: float
    status: str
    shipping_address: str
    payment_method: str
    payment_status: str
    created_at: datetime.datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

