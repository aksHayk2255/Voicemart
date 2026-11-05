import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.database.seed_data import seed_database
from backend.app.routes import (
    auth_router,
    products_router,
    cart_router,
    orders_router,
    assistant_router,
    admin_router
)

# Initialize database schema and auto-seed sample catalog
Base.metadata.create_all(bind=engine)
_db = SessionLocal()
try:
    seed_database(_db)
finally:
    _db.close()

app = FastAPI(
    title="VoiceMart API",
    description="AI-Powered Voice-Based Shopping Assistant REST API (BTech CSE Final Year Project)",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(assistant_router)
app.include_router(admin_router)

@app.get("/")
def read_root():
    return {
        "project": "VoiceMart – AI-Powered Voice-Based Shopping Assistant",
        "status": "Online",
        "documentation": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
