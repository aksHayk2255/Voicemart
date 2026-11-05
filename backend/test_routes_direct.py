"""Direct Route & Logic Integration Test Suite for VoiceMart."""

from backend.app.database.session import SessionLocal, Base, engine
from backend.app.database.seed_data import seed_database
from backend.app.models.user import User
from backend.app.schemas.user import UserLogin, UserRegister
from backend.app.schemas.assistant import VoiceCommandRequest, ComparisonRequest, RecommendationRequest
from backend.app.schemas.cart import CartItemCreate
from backend.app.schemas.order import OrderCreate
from backend.app.routes.auth import login, register, get_me
from backend.app.routes.products import list_products, get_categories, get_product
from backend.app.routes.assistant import process_voice_command, compare_products, get_recommendations
from backend.app.routes.cart import get_cart, add_to_cart, clear_cart
from backend.app.routes.orders import create_order, get_user_orders
from backend.app.routes.admin import get_admin_stats, get_all_users, get_all_orders

def test_all():
    print("=" * 60)
    print("RUNNING VOICEMART DIRECT ROUTE & SERVICE INTEGRATION TESTS")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    # 1. Test Login with Demo User
    login_res = login(UserLogin(email="john@example.com", password="User@123"), db)
    assert login_res["access_token"] is not None
    user = login_res["user"]
    print(f"[PASS] 1. Authentication Login: Logged in as '{user.username}' (role: {user.role})")

    # 2. Test Admin Login
    admin_login = login(UserLogin(email="admin@voicemart.com", password="Admin@123"), db)
    admin_user = admin_login["user"]
    assert admin_user.role == "admin"
    print(f"[PASS] 2. Admin Authentication: Logged in as '{admin_user.username}' (role: {admin_user.role})")

    # 3. Test Categories
    cats = get_categories(db)
    assert len(cats) >= 6
    print(f"[PASS] 3. Categories: Loaded {len(cats)} categories ({', '.join(c.name for c in cats)})")

    # 4. Test Product Listing & Filtering
    prods_all = list_products(db=db)
    assert prods_all["total"] >= 30
    print(f"[PASS] 4. Product Catalog: Loaded {prods_all['total']} total items")

    prods_phone = list_products(category="smartphones", db=db)
    assert prods_phone["total"] >= 5
    print(f"[PASS] 5. Category Filtering: Found {prods_phone['total']} smartphones")

    prods_budget = list_products(max_price=30000.0, db=db)
    assert prods_budget["total"] > 0
    print(f"[PASS] 6. Price Range Filtering: Found {prods_budget['total']} items <= ₹30,000")

    # 5. Test Voice Commands (All required test prompts from prompt spec)
    voice_prompts = [
        "Find smartphones.",
        "Show Samsung phones.",
        "Find laptops below 50000 rupees.",
        "Show headphones under 2000.",
        "Show the cheapest smartphones.",
        "Find highly rated products.",
        "Compare Samsung Galaxy S24 and Apple iPhone 15",
        "What is my cart total?"
    ]

    for p in voice_prompts:
        cmd_req = VoiceCommandRequest(command=p)
        cmd_res = process_voice_command(cmd_req, db, user)
        assert cmd_res["intent"] is not None
        assert len(cmd_res["spoken_response"]) > 0
        print(f"[PASS] Voice AI: '{p}' -> Intent: {cmd_res['intent']} | Spoken: '{cmd_res['spoken_response'][:45]}...'")

    # 6. Test Add to Cart via Voice & API
    clear_cart(user, db)
    add_res = add_to_cart(CartItemCreate(product_id=1, quantity=1), user, db)
    assert add_res["item_count"] == 1
    print(f"[PASS] 7. Cart: Added product (Count: {add_res['item_count']}, Total: ₹{add_res['total']:,.2f})")

    # Test Voice "What is my cart total?"
    cart_voice = process_voice_command(VoiceCommandRequest(command="What is my cart total?"), db, user)
    assert cart_voice["intent"] == "CHECK_CART"
    print(f"[PASS] 8. Voice Cart Inquiry: '{cart_voice['spoken_response']}'")

    # 7. Test Product Comparison Engine
    comp_res = compare_products(ComparisonRequest(product_ids=[1, 2]), db)
    assert len(comp_res["products"]) == 2
    assert comp_res["better_value_product_id"] is not None
    print(f"[PASS] 9. Comparison: Highlighted Better Value Product ID: {comp_res['better_value_product_id']}")

    # 8. Test AI Recommendation Engine
    recs = get_recommendations(RecommendationRequest(category_slug="smartphones", budget=40000.0, limit=4), db, user)
    assert len(recs) > 0
    print(f"[PASS] 10. AI Recommendations: Scored {len(recs)} products (Top match: {recs[0]['product'].name} - {recs[0]['reason']})")

    # 9. Test Simulated Checkout & Order History
    order = create_order(
        OrderCreate(
            shipping_address="Alex Morgan, Flat 201, Green Acres, Bengaluru 560100",
            payment_method="Simulated UPI"
        ),
        user,
        db
    )
    assert order.order_number.startswith("VM-")
    print(f"[PASS] 11. Checkout: Created Order #{order.order_number} for ₹{order.total_amount:,.2f}")

    user_orders = get_user_orders(user, db)
    assert len(user_orders) >= 1
    print(f"[PASS] 12. Order History: Retrieved {len(user_orders)} orders for user")

    # 10. Test Admin Dashboard Controls
    stats = get_admin_stats(db, admin_user)
    assert stats["total_users"] >= 2
    assert stats["total_orders"] >= 1
    print(f"[PASS] 13. Admin Dashboard: Stats verified (Users: {stats['total_users']}, Orders: {stats['total_orders']}, Catalog: {stats['total_products']})")

    all_users = get_all_users(db, admin_user)
    assert len(all_users) >= 2
    print(f"[PASS] 14. Admin Users List: Verified {len(all_users)} registered users")

    db.close()
    print("=" * 60)
    print("ALL 14 UNIT & INTEGRATION TESTS PASSED WITH ZERO ERRORS!")
    print("=" * 60)

if __name__ == "__main__":
    test_all()

