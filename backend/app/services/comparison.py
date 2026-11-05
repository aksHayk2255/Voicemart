import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.product import Product

class ComparisonEngine:
    """Multi-product comparative analysis and automated value-for-money evaluation."""

    @classmethod
    def compare_products(cls, db: Session, product_ids: List[int]) -> Dict[str, Any]:
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        if not products:
            return {
                "products": [],
                "features": [],
                "verdict": "No products selected for comparison.",
                "better_value_product_id": None,
                "spoken_summary": "Please select at least two products to compare."
            }

        # Collect all unique specification keys
        specs_by_prod: Dict[int, Dict[str, Any]] = {}
        all_spec_keys = set()

        for p in products:
            try:
                specs = json.loads(p.specifications) if p.specifications else {}
            except Exception:
                specs = {}
            specs_by_prod[p.id] = specs
            for k in specs.keys():
                all_spec_keys.add(k)

        # Build feature rows
        features = []

        # Standard features
        features.append({
            "feature_name": "Brand",
            "values": {p.id: p.brand for p in products}
        })
        features.append({
            "feature_name": "Price",
            "values": {p.id: f"₹{p.price:,.2f}" for p in products}
        })
        features.append({
            "feature_name": "Original Price",
            "values": {p.id: f"₹{p.original_price:,.2f}" if p.original_price else "—" for p in products}
        })
        features.append({
            "feature_name": "Customer Rating",
            "values": {p.id: f"⭐ {p.rating} / 5 ({p.rating_count} reviews)" for p in products}
        })
        features.append({
            "feature_name": "Stock Availability",
            "values": {p.id: f"{p.stock} units available" if p.stock > 0 else "Out of stock" for p in products}
        })

        # Dynamic specification rows
        for k in sorted(list(all_spec_keys)):
            features.append({
                "feature_name": k,
                "values": {p.id: str(specs_by_prod[p.id].get(k, "—")) for p in products}
            })

        # Calculate "Better Value"
        # Value ratio = (Rating * 10,000) / Price
        best_value_prod = None
        best_value_score = -1.0

        for p in products:
            if p.price > 0:
                # Value score combines rating and price efficiency
                # e.g., higher rating per rupee spent
                val_score = (p.rating ** 1.5) / (p.price ** 0.5)
                if val_score > best_value_score:
                    best_value_score = val_score
                    best_value_prod = p

        better_id = best_value_prod.id if best_value_prod else products[0].id
        better_name = best_value_prod.name if best_value_prod else products[0].name

        # Construct verdict & spoken summary
        if len(products) >= 2:
            p1 = products[0]
            p2 = products[1]
            diff = abs(p1.price - p2.price)
            cheaper = p1 if p1.price < p2.price else p2
            higher_rated = p1 if p1.rating > p2.rating else p2

            verdict = (
                f"Comparing {p1.name} and {p2.name}: {cheaper.name} is ₹{diff:,.0f} more affordable. "
                f"{higher_rated.name} leads in customer satisfaction with a {higher_rated.rating}-star rating. "
                f"Overall, {better_name} delivers superior value for money based on features-to-price ratio."
            )

            spoken_summary = (
                f"Here is the comparison. Between {p1.name} and {p2.name}, {better_name} offers the better value. "
                f"{cheaper.name} is priced at ₹{cheaper.price:,.0f}, while {higher_rated.name} has a rating of {higher_rated.rating} stars."
            )
        else:
            verdict = f"{products[0].name} has a rating of {products[0].rating} and is priced at ₹{products[0].price:,.2f}."
            spoken_summary = verdict

        return {
            "products": products,
            "features": features,
            "verdict": verdict,
            "better_value_product_id": better_id,
            "spoken_summary": spoken_summary
        }

