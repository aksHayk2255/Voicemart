import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.order import Order, OrderItem
from backend.app.models.cart import CartItem
from backend.app.models.user import User
from backend.app.schemas.order import OrderCreate, OrderResponse
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user's cart
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place order with an empty cart."
        )

    total_amount = sum(item.product.price * item.quantity for item in cart_items if item.product)

    # Generate distinct simulated order number
    order_number = f"VM-{uuid.uuid4().hex[:8].upper()}"

    new_order = Order(
        user_id=current_user.id,
        order_number=order_number,
        total_amount=total_amount,
        status="confirmed",
        shipping_address=order_in.shipping_address,
        payment_method=order_in.payment_method,
        payment_status="Paid (Simulated)"
    )
    db.add(new_order)
    db.flush()

    for item in cart_items:
        if item.product:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product.id,
                quantity=item.quantity,
                unit_price=item.product.price,
                product_name=item.product.name,
                product_image=item.product.image_url
            )
            db.add(order_item)
            # Deduct stock
            if item.product.stock >= item.quantity:
                item.product.stock -= item.quantity

    # Clear user's cart
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    db.refresh(new_order)

    return new_order

@router.get("", response_model=List[OrderResponse])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

