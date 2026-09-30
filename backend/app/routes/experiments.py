"""
Experiment History and CSV Export API Routes.
"""

from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse
from typing import List

from app.schemas import ExperimentRecord

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])


def create_experiments_router(app_state) -> APIRouter:

    @router.get("", response_model=List[ExperimentRecord])
    def get_experiments(limit: int = Query(50, ge=1, le=500)):
        rows = app_state.db.get_experiments(limit=limit)
        return [ExperimentRecord(**r) for r in rows]

    @router.get("/export-csv", response_class=PlainTextResponse)
    def export_experiments_csv():
        csv_data = app_state.db.export_experiments_csv()
        return PlainTextResponse(
            content=csv_data,
            headers={"Content-Disposition": "attachment; filename=ghost_signal_experiments.csv"}
        )

    return router
