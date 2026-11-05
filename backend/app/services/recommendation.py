import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.product import Product
from backend.app.models.category import Category
from backend.app.models.order import Order, OrderItem
from backend.app.models.activity import UserActivity
from backend.app.models.user import User

class RecommendationEngine:
    """Transparent, rule-based recommendation engine scoring products on multiple user signals."""

    @classmethod
    def get_recommendations(
        cls,
        db: Session,
        user: Optional[User] = None,
        category_slug: Optional[str] = None,
        budget: Optional[float] = None,
        current_product_id: Optional[int] = None,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        
        # 1. Gather historical signals if user is authenticated
        favored_categories = set()
        favored_brands = set()
        viewed_product_ids = set()

        if category_slug:
            cat = db.query(Category).filter(Category.slug == category_slug).first()
            if cat:
                favored_categories.add(cat.id)

        if user:
            # Query past orders
            past_orders = db.query(Order).filter(Order.user_id == user.id).all()
            for o in past_orders:
                for item in o.items:
                    if item.product_id:
                        p = db.query(Product).filter(Product.id == item.product_id).first()
                        if p:
                            favored_categories.add(p.category_id)
                            favored_brands.add(p.brand.lower())

            # Query recent activity views
            recent_activities = db.query(UserActivity).filter(
                UserActivity.user_id == user.id,
                UserActivity.action_type == "view"
            ).order_by(UserActivity.created_at.desc()).limit(15).all()

            for act in recent_activities:
                if act.details:
                    try:
                        data = json.loads(act.details)
                        if "product_id" in data:
                            viewed_product_ids.add(int(data["product_id"]))
                    except Exception:
                        pass

        # If current_product_id provided, inspect its category & brand
        if current_product_id:
            curr = db.query(Product).filter(Product.id == current_product_id).first()
            if curr:
                favored_categories.add(curr.category_id)
                favored_brands.add(curr.brand.lower())

        # 2. Fetch candidate products
        all_products = db.query(Product).all()
        scored_products = []

        for p in all_products:
            # Exclude current product if viewing one
            if current_product_id and p.id == current_product_id:
                continue

            score, reason = cls._calculate_product_score(
                p=p,
                favored_categories=favored_categories,
                favored_brands=favored_brands,
                budget=budget,
                was_viewed=(p.id in viewed_product_ids)
            )

            scored_products.append({
                "product": p,
                "score": round(score, 3),
                "reason": reason
            })

        # Sort descending by score
        scored_products.sort(key=lambda x: x["score"], reverse=True)

        return scored_products[:limit]

    @classmethod
    def _calculate_product_score(
        cls,
        p: Product,
        favored_categories: set,
        favored_brands: set,
        budget: Optional[float],
        was_viewed: bool
    ) -> (float, str):
        # Weights:
        # Rating: 0.30
        # Category match: 0.35
        # Brand affinity: 0.15
        # Budget alignment: 0.20
        # Featured bonus: +0.05

        score = 0.0
        reasons = []

        # 1. Rating score (up to 0.30)
        norm_rating = (p.rating / 5.0) if p.rating else 0.8
        score += norm_rating * 0.30
        if p.rating >= 4.7:
            reasons.append("Top-rated by customers")

        # 2. Category match (0.35)
        if favored_categories and p.category_id in favored_categories:
            score += 0.35
            reasons.append("Matches your preferred category")
        elif not favored_categories:
            score += 0.15

        # 3. Brand match (0.15)
        if favored_brands and p.brand.lower() in favored_brands:
            score += 0.15
            reasons.append(f"From {p.brand}, a brand you trust")

        # 4. Budget fit (0.20)
        if budget:
            if p.price <= budget:
                # Closer to budget without going over
                ratio = p.price / budget
                score += 0.20 * (0.5 + 0.5 * ratio)
                reasons.append(f"Fits within your ₹{budget:,.0f} budget")
            else:
                # Exceeds budget penalty
                over_ratio = (p.price - budget) / budget
                score -= min(0.20, over_ratio * 0.15)
        else:
            score += 0.10

        # 5. Featured bonus
        if p.is_featured:
            score += 0.05
            if not reasons:
                reasons.append("Featured VoiceMart Pick")

        # 6. Recently viewed boost
        if was_viewed:
            score += 0.08
            reasons.append("Based on items you recently viewed")

        primary_reason = reasons[0] if reasons else "Popular among buyers"
        return score, primary_reason

