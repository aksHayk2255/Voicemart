from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.cart import CartItem
from backend.app.models.product import Product
from backend.app.models.user import User
from backend.app.schemas.cart import CartItemCreate, CartItemUpdate, CartSummaryResponse, CartItemResponse
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Shopping Cart"])

@router.get("", response_model=CartSummaryResponse)
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    subtotal = sum(item.product.price * item.quantity for item in items if item.product)
    
    # Calculate savings if original_price exists
    total_original = sum(
        (item.product.original_price or item.product.price) * item.quantity 
        for item in items if item.product
    )
    discount = max(0.0, total_original - subtotal)
    total = subtotal
    item_count = sum(item.quantity for item in items)

    return {
        "items": items,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "item_count": item_count
    }

@router.post("", response_model=CartSummaryResponse)
def add_to_cart(
    item_in: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item_in.product_id
    ).first()

    if existing_item:
        existing_item.quantity += item_in.quantity
    else:
        new_item = CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(new_item)

    db.commit()
    return get_cart(current_user, db)

@router.put("/{item_id}", response_model=CartSummaryResponse)
def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if item_in.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = item_in.quantity

    db.commit()
    return get_cart(current_user, db)

@router.delete("/{item_id}", response_model=CartSummaryResponse)
def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    return get_cart(current_user, db)

@router.delete("/clear/all", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return None

