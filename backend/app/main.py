"""
GHOST SIGNAL — WHAT IF?
FastAPI Application Entry Point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse
from contextlib import asynccontextmanager
from pathlib import Path
import pandas as pd
import numpy as np

from app.config import RESEARCH_DISCLAIMER
from app.storage.db import Database
from app.ml.synthetic_data import generate_synthetic_cohort
from app.ml.models import MLPipeline
from app.ml.data_quality import DataQualityMonitor
from app.ml.simulator import WhatIfSimulator

from app.routes.health import create_health_router
from app.routes.dashboard import create_dashboard_router
from app.routes.records import create_records_router
from app.routes.data_quality import create_data_quality_router
from app.routes.models import create_models_router
from app.routes.simulator import create_simulator_router
from app.routes.experiments import create_experiments_router


class AppState:
    def __init__(self):
        self.db = Database()
        self.pipeline = MLPipeline()
        self.data_quality_monitor = DataQualityMonitor()
        self.simulator = WhatIfSimulator(self.pipeline)

    def sync_predictions_and_quality(self):
        """Calculates baseline risk, GA risk, and quality flags for all records in DB."""
        df = self.db.get_records_df()
        if df.empty or not self.pipeline.is_trained:
            return

        records = df.to_dict(orient="records")
        for r in records:
            rec_id = str(r["record_id"])
            vitals = {
                "heart_rate": r.get("heart_rate"),
                "spo2": r.get("spo2"),
                "systolic_bp": r.get("systolic_bp"),
                "diastolic_bp": r.get("diastolic_bp"),
                "respiratory_rate": r.get("respiratory_rate"),
                "temperature": r.get("temperature")
            }
            try:
                b_risk, ga_risk = self.pipeline.predict_vitals(vitals)
            except Exception:
                b_risk, ga_risk = 0.50, 0.50

            warnings = self.data_quality_monitor.audit_record(r)
            if not warnings:
                status = "CLEAN"
            elif any(w.severity == "CRITICAL" for w in warnings):
                status = "DEFECT"
            else:
                status = "WARNING"

            self.db.update_record_scores_and_status(rec_id, b_risk, ga_risk, status)


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize cohort and models if database is empty or models untrained
    if app_state.db.record_count() == 0:
        print("[GHOST SIGNAL] Initializing synthetic cohort (600 records)...")
        synthetic_df = generate_synthetic_cohort(n_samples=600, random_seed=42)
        app_state.db.replace_records(synthetic_df)
    
    # Train pipeline
    print("[GHOST SIGNAL] Training Baseline & GA ML Pipeline...")
    df = app_state.db.get_records_df()
    app_state.pipeline.train_pipeline(df)
    
    # Sync predictions
    print("[GHOST SIGNAL] Synchronizing baseline/GA risk predictions and quality status...")
    app_state.sync_predictions_and_quality()
    print("[GHOST SIGNAL] Backend startup sequence complete. Ready for research simulation.")

    yield
    print("[GHOST SIGNAL] Backend shutting down.")


app = FastAPI(
    title="GHOST SIGNAL — WHAT IF? Research API",
    description=(
        "Biomedical AI reliability research and simulation platform exploring vital-sign data quality, "
        "missing readings, stale timestamps, and sensor noise impact on Random Forest risk scores.\n\n"
        f"**Safety Disclaimer**: {RESEARCH_DISCLAIMER}"
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(create_health_router(app_state))
app.include_router(create_dashboard_router(app_state))
app.include_router(create_records_router(app_state))
app.include_router(create_data_quality_router(app_state))
app.include_router(create_models_router(app_state))
app.include_router(create_simulator_router(app_state))
app.include_router(create_experiments_router(app_state))

STATIC_DIR = Path(__file__).resolve().parent / "static"
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

# AI Discovery & LLM Agent Context Routes
@app.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt():
    robots_path = STATIC_DIR / "robots.txt"
    if robots_path.exists():
        return PlainTextResponse(robots_path.read_text())
    return PlainTextResponse("User-agent: *\nAllow: /\n")

@app.get("/llms.txt", response_class=PlainTextResponse)
def get_llms_txt():
    llms_path = STATIC_DIR / "llms.txt"
    if llms_path.exists():
        return PlainTextResponse(llms_path.read_text())
    return PlainTextResponse("GHOST SIGNAL — WHAT IF? Research Platform\n")

@app.get("/llms-full.txt", response_class=PlainTextResponse)
def get_llms_full_txt():
    full_path = STATIC_DIR / "llms-full.txt"
    if full_path.exists():
        return PlainTextResponse(full_path.read_text())
    return PlainTextResponse("GHOST SIGNAL — WHAT IF? Full Documentation\n")

# Mount built frontend assets if available
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="static_assets")

# Root & SPA Fallback Route for browsers and AI crawlers
@app.get("/{full_path:path}")
def serve_spa_frontend(full_path: str):
    # Pass through API and system paths
    if full_path.startswith("api/") or full_path in ["docs", "openapi.json", "redoc"]:
        return None
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return PlainTextResponse(
        "GHOST SIGNAL — WHAT IF? Backend running. Frontend dist not found.",
        status_code=200
    )


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
