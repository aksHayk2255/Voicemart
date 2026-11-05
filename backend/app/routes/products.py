import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database.session import get_db
from backend.app.models.product import Product
from backend.app.models.category import Category
from backend.app.schemas.product import (
    ProductResponse,
    ProductListResponse,
    ProductCreate,
    ProductUpdate,
    CategoryResponse
)
from backend.app.services.auth import get_current_admin

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("", response_model=ProductListResponse)
def list_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    rating: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,  # price_asc, price_desc, rating_desc, newest
    featured: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if category:
        cat = db.query(Category).filter(
            or_(Category.slug == category.lower(), Category.name.ilike(f"%{category}%"))
        ).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)

    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if rating is not None:
        query = query.filter(Product.rating >= rating)

    if featured is not None:
        query = query.filter(Product.is_featured == featured)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.brand.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating_desc":
        query = query.order_by(Product.rating.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.id.asc())

    # Handle default if called directly without FastAPI injection
    page_num = page.default if hasattr(page, 'default') else page
    limit_num = limit.default if hasattr(limit, 'default') else limit

    total = query.count()
    products = query.offset((page_num - 1) * limit_num).limit(limit_num).all()

    return {
        "products": products,
        "total": total,
        "page": page_num,
        "limit": limit_num
    }

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate, 
    db: Session = Depends(get_db), 
    admin = Depends(get_current_admin)
):
    # Verify category exists
    category = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category ID")

    new_prod = Product(
        name=product_in.name,
        brand=product_in.brand,
        category_id=product_in.category_id,
        price=product_in.price,
        original_price=product_in.original_price,
        description=product_in.description,
        image_url=product_in.image_url,
        stock=product_in.stock,
        is_featured=product_in.is_featured,
        rating=product_in.rating,
        rating_count=product_in.rating_count,
        specifications=product_in.specifications or "{}"
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return None
