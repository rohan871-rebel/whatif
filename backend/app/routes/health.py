"""
Health and Status API Endpoint.
"""

from fastapi import APIRouter
from app.schemas import HealthResponse
from app.config import RESEARCH_DISCLAIMER

router = APIRouter(prefix="/api/health", tags=["Health"])


def create_health_router(app_state) -> APIRouter:
    @router.get("", response_model=HealthResponse)
    def check_health():
        db_connected = app_state.db.record_count() >= 0
        models_ready = app_state.pipeline.is_trained
        return HealthResponse(
            status="healthy",
            version="1.0.0",
            database_connected=db_connected,
            models_trained=models_ready,
            synthetic_mode=True,
            disclaimer=RESEARCH_DISCLAIMER
        )

    return router
