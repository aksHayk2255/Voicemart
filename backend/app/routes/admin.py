from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.order import Order
from backend.app.models.product import Product
from backend.app.schemas.user import UserResponse
from backend.app.schemas.order import OrderResponse
from backend.app.services.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    
    orders = db.query(Order).all()
    total_revenue = sum(o.total_amount for o in orders)

    low_stock_products = db.query(Product).filter(Product.stock <= 15).count()
    out_of_stock_products = db.query(Product).filter(Product.stock == 0).count()

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "low_stock_count": low_stock_products,
        "out_of_stock_count": out_of_stock_products
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    order.status = status.lower()
    db.commit()
    return {"message": "Status updated successfully", "order_id": order.id, "status": order.status}

