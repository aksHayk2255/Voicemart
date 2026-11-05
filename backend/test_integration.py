"""Comprehensive Integration Test Suite for VoiceMart Backend & AI Assistant."""

import sys
from starlette.testclient import TestClient
from backend.main import app

def run_tests():
    print("=" * 60, flush=True)
    print("STARTING VOICEMART COMPREHENSIVE INTEGRATION TEST SUITE", flush=True)
    print("=" * 60, flush=True)

    with TestClient(app) as client:
        # 1. Test Root Health Endpoint
        res = client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("[PASS] 1. Root API Health Check", flush=True)

        # 2. Test User Login (Seed Admin & Normal User)
        login_user_res = client.post("/api/auth/login", json={"email": "john@example.com", "password": "User@123"})
        assert login_user_res.status_code == 200, f"User login failed: {login_user_res.text}"
        user_token = login_user_res.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        print("[PASS] 2. User Authentication (Login & JWT issuance)", flush=True)

        login_admin_res = client.post("/api/auth/login", json={"email": "admin@voicemart.com", "password": "Admin@123"})
        assert login_admin_res.status_code == 200, f"Admin login failed: {login_admin_res.text}"
        admin_token = login_admin_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[PASS] 3. Admin Authentication (Role verified)", flush=True)

        # 3. Test Categories and Products List
        cat_res = client.get("/api/products/categories")
        assert cat_res.status_code == 200
        categories = cat_res.json()
        assert len(categories) >= 6, f"Expected 6 categories, got {len(categories)}"
        print(f"[PASS] 4. Categories Loaded ({len(categories)} categories)", flush=True)

        prod_res = client.get("/api/products")
        assert prod_res.status_code == 200
        total_prods = prod_res.json()["total"]
        assert total_prods >= 30, f"Expected at least 30 products, got {total_prods}"
        print(f"[PASS] 5. Catalog Products Loaded ({total_prods} products)", flush=True)

        # 4. Test Voice Shopping Assistant Commands (Section 5 Spec)
        commands_to_test = [
            ("Find smartphones.", "SEARCH_PRODUCT"),
            ("Show Samsung phones.", "SEARCH_PRODUCT"),
            ("Find laptops below 50000 rupees.", "SEARCH_PRODUCT"),
            ("Show headphones under 2000.", "SEARCH_PRODUCT"),
            ("Show the cheapest smartphones.", "SEARCH_PRODUCT"),
            ("Find highly rated products.", "SEARCH_PRODUCT"),
            ("Compare Samsung Galaxy S24 and Apple iPhone 15", "COMPARE_PRODUCTS"),
            ("What is my cart total?", "CHECK_CART"),
            ("Add Apple iPhone 15 Pro to cart", "ADD_TO_CART")
        ]

        for cmd, expected_intent in commands_to_test:
            res = client.post(
                "/api/assistant/command",
                json={"command": cmd},
                headers=user_headers
            )
            assert res.status_code == 200, f"Voice command '{cmd}' failed: {res.text}"
            data = res.json()
            assert data["intent"] == expected_intent, f"Command '{cmd}': expected {expected_intent}, got {data['intent']}"
            assert len(data["spoken_response"]) > 0, f"Empty spoken response for '{cmd}'"
            print(f"[PASS] Voice Command: '{cmd}' -> Intent: {data['intent']} | Action: {data['action']}", flush=True)

        # 5. Test AI Rule-Based Recommendations
        rec_res = client.post(
            "/api/assistant/recommendations",
            json={"category_slug": "smartphones", "budget": 50000.0, "limit": 4},
            headers=user_headers
        )
        assert rec_res.status_code == 200
        recs = rec_res.json()
        assert len(recs) > 0
        print(f"[PASS] 6. AI Recommendations Engine ({len(recs)} scored items returned)", flush=True)

        # 6. Test Product Comparison Engine
        comp_res = client.post(
            "/api/assistant/compare",
            json={"product_ids": [1, 2]}
        )
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert len(comp_data["products"]) == 2
        assert comp_data["better_value_product_id"] is not None
        assert len(comp_data["features"]) > 0
        print(f"[PASS] 7. Product Comparison Engine (Verdict: {comp_data['verdict'][:50]}...)", flush=True)

        # 7. Test Cart Operations
        cart_res = client.get("/api/cart", headers=user_headers)
        assert cart_res.status_code == 200
        cart_data = cart_res.json()
        assert cart_data["item_count"] >= 1
        print(f"[PASS] 8. Cart Operations (Current Count: {cart_data['item_count']}, Total: ₹{cart_data['total']:,.2f})", flush=True)

        # 8. Test Simulated Checkout and Order Placement
        order_res = client.post(
            "/api/orders",
            json={
                "shipping_address": "Test Demo User, 123 Tech Park, Bengaluru, 560100",
                "payment_method": "Simulated UPI"
            },
            headers=user_headers
        )
        assert order_res.status_code == 201, f"Checkout failed: {order_res.text}"
        order_data = order_res.json()
        assert order_data["order_number"].startswith("VM-")
        print(f"[PASS] 9. Simulated Checkout Complete (Order ID: {order_data['order_number']}, Total: ₹{order_data['total_amount']:,.2f})", flush=True)

        # 9. Test User Orders History
        orders_list_res = client.get("/api/orders", headers=user_headers)
        assert orders_list_res.status_code == 200
        assert len(orders_list_res.json()) >= 1
        print(f"[PASS] 10. Order History Loaded ({len(orders_list_res.json())} orders)", flush=True)

        # 10. Test Admin Dashboard Endpoints
        admin_stats_res = client.get("/api/admin/stats", headers=admin_headers)
        assert admin_stats_res.status_code == 200
        stats = admin_stats_res.json()
        print(f"[PASS] 11. Admin Stats (Revenue: ₹{stats['total_revenue']:,.2f}, Orders: {stats['total_orders']}, Users: {stats['total_users']})", flush=True)

        admin_users_res = client.get("/api/admin/users", headers=admin_headers)
        assert admin_users_res.status_code == 200
        print(f"[PASS] 12. Admin Users List Loaded ({len(admin_users_res.json())} users)", flush=True)

    print("=" * 60, flush=True)
    print("ALL 12 INTEGRATION TESTS PASSED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    run_tests()
