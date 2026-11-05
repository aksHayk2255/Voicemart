from backend.app.routes.auth import router as auth_router
from backend.app.routes.products import router as products_router
from backend.app.routes.cart import router as cart_router
from backend.app.routes.orders import router as orders_router
from backend.app.routes.assistant import router as assistant_router
from backend.app.routes.admin import router as admin_router

__all__ = [
    "auth_router",
    "products_router",
    "cart_router",
    "orders_router",
    "assistant_router",
    "admin_router"
]

