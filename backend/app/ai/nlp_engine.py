from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from backend.app.ai.intent_parser import NLPIntentParser
from backend.app.ai.gemini_client import GeminiClient
from backend.app.models.product import Product
from backend.app.models.category import Category
from backend.app.models.cart import CartItem
from backend.app.models.user import User

class NLPEngine:
    """Core VoiceMart conversational engine coordinating intent parsing, DB queries, and spoken feedback."""

    @classmethod
    def process_command(
        cls, 
        command_text: str, 
        db: Session, 
        user: Optional[User] = None, 
        current_product_id: Optional[int] = None
    ) -> Dict[str, Any]:
        
        # 1. First parse locally
        parsed = NLPIntentParser.parse(command_text, context={"current_product_id": current_product_id})
        intent = parsed["intent"]
        entities = parsed["entities"]

        # 2. Check if optional Gemini refinement should supplement
        if GeminiClient.is_available() and intent == "GENERAL_QUERY":
            gemini_result = GeminiClient.refine_query(command_text)
            if gemini_result and "intent" in gemini_result:
                intent = gemini_result.get("intent", intent)
                for k in ["category", "brand", "min_price", "max_price", "sort_by", "keyword"]:
                    if gemini_result.get(k) is not None:
                        entities[k] = gemini_result[k]

        # 3. Handle intents
        if intent == "CHECK_CART":
            return cls._handle_check_cart(db, user)

        elif intent == "ADD_TO_CART":
            return cls._handle_add_to_cart(db, user, entities, current_product_id)

        elif intent == "REMOVE_FROM_CART":
            return cls._handle_remove_from_cart(db, user, entities)

        elif intent == "COMPARE_PRODUCTS":
            return cls._handle_compare(db, entities)

        elif intent in ["SEARCH_PRODUCT", "FILTER_PRODUCT", "SORT_PRODUCT"]:
            return cls._handle_search(db, entities, command_text)

        else:
            return cls._handle_general_query(command_text)

    @classmethod
    def _handle_check_cart(cls, db: Session, user: Optional[User]) -> Dict[str, Any]:
        if not user:
            return {
                "transcript": "Check cart",
                "intent": "CHECK_CART",
                "entities": {},
                "spoken_response": "Please log in to your VoiceMart account to view and manage your cart.",
                "display_response": "Please **log in** to view your shopping cart.",
                "action": "NAVIGATE",
                "action_data": {"path": "/login"},
                "products": []
            }

        cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
        if not cart_items:
            return {
                "transcript": "Check cart",
                "intent": "CHECK_CART",
                "entities": {},
                "spoken_response": "Your shopping cart is currently empty. Would you like me to recommend some trending electronics?",
                "display_response": "Your shopping cart is empty.",
                "action": "CART_TOTAL",
                "action_data": {"item_count": 0, "total": 0.0},
                "products": []
            }

        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        count = sum(item.quantity for item in cart_items)
        spoken = f"You have {count} item{'s' if count > 1 else ''} in your cart, with a total of ₹{total:,.0f}."
        display = f"🛒 You have **{count} item{'s' if count > 1 else ''}** in your cart. Total: **₹{total:,.2f}**."

        return {
            "transcript": "Check cart",
            "intent": "CHECK_CART",
            "entities": {},
            "spoken_response": spoken,
            "display_response": display,
            "action": "CART_TOTAL",
            "action_data": {
                "item_count": count, 
                "total": total,
                "path": "/cart"
            },
            "products": [item.product for item in cart_items if item.product]
        }

    @classmethod
    def _handle_add_to_cart(
        cls, 
        db: Session, 
        user: Optional[User], 
        entities: Dict[str, Any], 
        current_product_id: Optional[int]
    ) -> Dict[str, Any]:
        if not user:
            return {
                "transcript": "Add to cart",
                "intent": "ADD_TO_CART",
                "entities": entities,
                "spoken_response": "Please log in first to add items to your cart.",
                "display_response": "Please log in to add items to your cart.",
                "action": "NAVIGATE",
                "action_data": {"path": "/login"},
                "products": []
            }

        target_product = None
        # Try target_product_id or current_product_id
        prod_id = entities.get("target_product_id") or current_product_id
        if prod_id:
            target_product = db.query(Product).filter(Product.id == prod_id).first()

        # If not, try product name from entities
        if not target_product and entities.get("product_name"):
            name_term = entities["product_name"]
            target_product = db.query(Product).filter(Product.name.ilike(f"%{name_term}%")).first()

        if not target_product:
            return {
                "transcript": "Add to cart",
                "intent": "ADD_TO_CART",
                "entities": entities,
                "spoken_response": "Which product would you like me to add? Please view a product or specify its name.",
                "display_response": "Could not identify which product to add. Try saying: *'Add Samsung Galaxy S24 to cart'*.",
                "action": "MESSAGE",
                "action_data": None,
                "products": []
            }

        # Check existing cart item
        existing = db.query(CartItem).filter(
            CartItem.user_id == user.id,
            CartItem.product_id == target_product.id
        ).first()

        if existing:
            existing.quantity += 1
        else:
            new_item = CartItem(user_id=user.id, product_id=target_product.id, quantity=1)
            db.add(new_item)
        db.commit()

        spoken = f"I've added {target_product.name} to your cart for ₹{target_product.price:,.0f}."
        display = f"✅ Added **{target_product.name}** to your cart (₹{target_product.price:,.2f})."

        return {
            "transcript": "Add to cart",
            "intent": "ADD_TO_CART",
            "entities": entities,
            "spoken_response": spoken,
            "display_response": display,
            "action": "CART_UPDATED",
            "action_data": {"product_id": target_product.id, "product_name": target_product.name},
            "products": [target_product]
        }

    @classmethod
    def _handle_remove_from_cart(cls, db: Session, user: Optional[User], entities: Dict[str, Any]) -> Dict[str, Any]:
        if not user:
            return {
                "transcript": "Remove from cart",
                "intent": "REMOVE_FROM_CART",
                "entities": entities,
                "spoken_response": "Please log in to manage your cart items.",
                "display_response": "Please log in to manage your cart.",
                "action": "NAVIGATE",
                "action_data": {"path": "/login"},
                "products": []
            }

        cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).order_id_ascending() if hasattr(CartItem, 'id') else db.query(CartItem).filter(CartItem.user_id == user.id).order_by(CartItem.id.asc()).all()

        if not cart_items:
            return {
                "transcript": "Remove from cart",
                "intent": "REMOVE_FROM_CART",
                "entities": entities,
                "spoken_response": "Your cart is already empty.",
                "display_response": "Your cart is already empty.",
                "action": "MESSAGE",
                "action_data": None,
                "products": []
            }

        idx = entities.get("item_index", 0)
        if idx == -1 or idx >= len(cart_items):
            idx = len(cart_items) - 1

        target_item = cart_items[idx]
        prod_name = target_item.product.name if target_item.product else "Item"
        db.delete(target_item)
        db.commit()

        spoken = f"Removed {prod_name} from your cart."
        display = f"🗑️ Removed **{prod_name}** from your cart."

        return {
            "transcript": "Remove from cart",
            "intent": "REMOVE_FROM_CART",
            "entities": entities,
            "spoken_response": spoken,
            "display_response": display,
            "action": "CART_UPDATED",
            "action_data": {"removed_item_id": target_item.id},
            "products": []
        }

    @classmethod
    def _handle_compare(cls, db: Session, entities: Dict[str, Any]) -> Dict[str, Any]:
        terms = entities.get("compare_terms") or []
        found_products: List[Product] = []

        for term in terms:
            p = db.query(Product).filter(
                (Product.name.ilike(f"%{term}%")) | (Product.brand.ilike(f"%{term}%"))
            ).first()
            if p and p not in found_products:
                found_products.append(p)

        if len(found_products) >= 2:
            prod_ids = [p.id for p in found_products[:3]]
            names = " and ".join(p.name for p in found_products[:2])
            spoken = f"Comparing {names}. Let's see how their specifications and value stack up."
            display = f"Comparing **{found_products[0].name}** and **{found_products[1].name}**."
            return {
                "transcript": "Compare products",
                "intent": "COMPARE_PRODUCTS",
                "entities": entities,
                "spoken_response": spoken,
                "display_response": display,
                "action": "COMPARE",
                "action_data": {"product_ids": prod_ids, "path": f"/compare?ids={','.join(map(str, prod_ids))}"},
                "products": found_products
            }
        else:
            # Fallback prompt
            return {
                "transcript": "Compare products",
                "intent": "COMPARE_PRODUCTS",
                "entities": entities,
                "spoken_response": "I can compare any products for you. Try saying: Compare Samsung Galaxy S24 and Apple iPhone 15.",
                "display_response": "Please specify two products to compare, or select them from the comparison page.",
                "action": "NAVIGATE",
                "action_data": {"path": "/compare"},
                "products": []
            }

    @classmethod
    def _handle_search(cls, db: Session, entities: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
        query = db.query(Product)
        filters_applied = []

        # Category
        cat_name = entities.get("category")
        if cat_name:
            cat = db.query(Category).filter(Category.name.ilike(f"%{cat_name}%")).first()
            if cat:
                query = query.filter(Product.category_id == cat.id)
                filters_applied.append(cat.name)

        # Brand
        brand = entities.get("brand")
        if brand:
            query = query.filter(Product.brand.ilike(f"%{brand}%"))
            filters_applied.append(brand)

        # Max price
        max_p = entities.get("max_price")
        if max_p is not None:
            query = query.filter(Product.price <= max_p)
            filters_applied.append(f"under ₹{max_p:,.0f}")

        # Min price
        min_p = entities.get("min_price")
        if min_p is not None:
            query = query.filter(Product.price >= min_p)
            filters_applied.append(f"above ₹{min_p:,.0f}")

        # Keyword
        kw = entities.get("keyword")
        if kw:
            query = query.filter(
                (Product.name.ilike(f"%{kw}%")) | 
                (Product.description.ilike(f"%{kw}%")) |
                (Product.brand.ilike(f"%{kw}%"))
            )

        # Sorting
        sort_by = entities.get("sort_by")
        if sort_by == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort_by == "rating_desc":
            query = query.order_by(Product.rating.desc())
        else:
            query = query.order_by(Product.id.asc())

        products = query.limit(8).all()

        if not products:
            spoken = "I couldn't find any products matching those criteria. Would you like to adjust your budget or category?"
            display = f"No products found for **'{raw_text}'**. Try broadening your price range or search terms."
            return {
                "transcript": raw_text,
                "intent": "SEARCH_PRODUCT",
                "entities": entities,
                "spoken_response": spoken,
                "display_response": display,
                "action": "SEARCH_RESULTS",
                "action_data": {"count": 0},
                "products": []
            }

        # Craft spoken description
        count = len(products)
        filter_phrase = " ".join(filters_applied) if filters_applied else "popular products"
        cheapest_price = min(p.price for p in products)

        if sort_by == "price_asc":
            spoken = f"Here are the lowest priced {filter_phrase}, starting from ₹{cheapest_price:,.0f}."
        elif sort_by == "rating_desc":
            spoken = f"Here are the highest rated {filter_phrase}, with ratings up to {products[0].rating} stars."
        else:
            spoken = f"Found {count} {filter_phrase} for you. Check out the top recommendations."

        display = f"Found **{count}** matching item{'s' if count > 1 else ''} for *'{raw_text}'*."

        return {
            "transcript": raw_text,
            "intent": "SEARCH_PRODUCT",
            "entities": entities,
            "spoken_response": spoken,
            "display_response": display,
            "action": "SEARCH_RESULTS",
            "action_data": {
                "count": count,
                "category": cat_name,
                "brand": brand,
                "max_price": max_p,
                "sort_by": sort_by
            },
            "products": products
        }

    @classmethod
    def _handle_general_query(cls, text: str) -> Dict[str, Any]:
        spoken = "Hello! I am VoiceMart, your AI shopping assistant. You can speak to search products, filter by budget, add items to cart, or compare gadgets."
        display = """### Welcome to VoiceMart AI! 🎙️
I can help you navigate and shop hands-free. Try saying:
- *"Find laptops below 50,000 rupees"*
- *"Show Samsung phones"*
- *"Show the cheapest smartphones"*
- *"Show headphones under 2000"*
- *"Compare these two products"*
- *"What is my cart total?"*
"""
        return {
            "transcript": text,
            "intent": "GENERAL_QUERY",
            "entities": {},
            "spoken_response": spoken,
            "display_response": display,
            "action": "MESSAGE",
            "action_data": None,
            "products": []
        }

