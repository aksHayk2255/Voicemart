import json
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.activity import UserActivity
from backend.app.schemas.assistant import (
    VoiceCommandRequest,
    VoiceCommandResponse,
    RecommendationRequest,
    ComparisonRequest,
    ProductComparisonResponse
)
from backend.app.schemas.product import ProductResponse
from backend.app.services.auth import get_current_user_optional
from backend.app.ai.nlp_engine import NLPEngine
from backend.app.services.recommendation import RecommendationEngine
from backend.app.services.comparison import ComparisonEngine

router = APIRouter(prefix="/api/assistant", tags=["AI Voice Assistant"])

@router.post("/command", response_model=VoiceCommandResponse)
def process_voice_command(
    cmd_in: VoiceCommandRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    # Log user voice query activity
    try:
        activity = UserActivity(
            user_id=user.id if user else None,
            session_id=cmd_in.session_id,
            action_type="voice_query",
            details=json.dumps({"command": cmd_in.command, "current_product_id": cmd_in.current_product_id})
        )
        db.add(activity)
        db.commit()
    except Exception:
        pass

    result = NLPEngine.process_command(
        command_text=cmd_in.command,
        db=db,
        user=user,
        current_product_id=cmd_in.current_product_id
    )

    return result

@router.post("/recommendations")
def get_recommendations(
    req: RecommendationRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    recommendations = RecommendationEngine.get_recommendations(
        db=db,
        user=user,
        category_slug=req.category_slug,
        budget=req.budget,
        current_product_id=req.current_product_id,
        limit=req.limit
    )

    formatted = []
    for item in recommendations:
        p = item["product"]
        formatted.append({
            "product": ProductResponse.model_validate(p),
            "score": item["score"],
            "reason": item["reason"]
        })

    return formatted

@router.post("/compare", response_model=ProductComparisonResponse)
def compare_products(
    req: ComparisonRequest,
    db: Session = Depends(get_db)
):
    result = ComparisonEngine.compare_products(db=db, product_ids=req.product_ids)
    return result

