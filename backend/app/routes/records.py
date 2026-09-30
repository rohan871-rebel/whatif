"""
Record Explorer and Dataset Management API Routes.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import PlainTextResponse
import pandas as pd
import io

from app.schemas import VitalRecord
from app.ml.synthetic_data import generate_synthetic_cohort, FEATURE_NAMES

router = APIRouter(prefix="/api/records", tags=["Records"])


def create_records_router(app_state) -> APIRouter:

    @router.get("")
    def get_records(
        search: Optional[str] = Query(None, description="Search by record ID"),
        quality_status: Optional[str] = Query(None, description="Filter by status (CLEAN, WARNING, DEFECT)"),
        is_critical: Optional[int] = Query(None, description="Filter by critical label (0 or 1)"),
        sort_by: str = Query("record_id", description="Field to sort by"),
        order: str = Query("ASC", description="ASC or DESC"),
        limit: int = Query(50, ge=1, le=200),
        offset: int = Query(0, ge=0)
    ):
        rows, total = app_state.db.get_records(
            search=search,
            quality_status=quality_status,
            is_critical=is_critical,
            sort_by=sort_by,
            order=order,
            limit=limit,
            offset=offset
        )
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "records": rows,
            "disclaimer": "Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions."
        }

    @router.get("/sample-csv", response_class=PlainTextResponse)
    def download_sample_csv():
        """Returns downloadable sample CSV template for de-identified dataset uploads."""
        sample_df = generate_synthetic_cohort(n_samples=5, random_seed=99)
        output = io.StringIO()
        sample_df.to_csv(output, index=False)
        return PlainTextResponse(
            content=output.getvalue(),
            headers={"Content-Disposition": "attachment; filename=ghost_signal_sample_vitals.csv"}
        )

    @router.get("/{record_id}")
    def get_record_detail(record_id: str):
        record = app_state.db.get_record_by_id(record_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")
        
        # Also run audit for fresh warnings
        warnings = app_state.data_quality_monitor.audit_record(record)
        record["quality_warnings"] = [w.message for w in warnings]
        return record

    @router.post("/reset-synthetic")
    def reset_synthetic_cohort(n_samples: int = Query(600, ge=100, le=2000)):
        """Regenerates the synthetic research cohort and retrains models."""
        df = generate_synthetic_cohort(n_samples=n_samples)
        app_state.db.replace_records(df)
        
        # Retrain pipeline
        app_state.pipeline.train_pipeline(df)
        
        # Update baseline and GA predictions and quality statuses in DB
        app_state.sync_predictions_and_quality()

        return {
            "status": "success",
            "message": f"Successfully regenerated {len(df)} synthetic records and retrained models.",
            "total_records": len(df)
        }

    @router.post("/upload-csv")
    async def upload_csv(file: UploadFile = File(...)):
        """
        Uploads an authorized de-identified CSV dataset.
        Validates schema, column names, and data types.
        """
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

        contents = await file.read()
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

        # Mandatory columns
        required_cols = {"record_id", "timestamp", "is_critical"}
        missing_mandatory = required_cols - set(df.columns)
        if missing_mandatory:
            raise HTTPException(
                status_code=422,
                detail=f"CSV is missing mandatory columns: {list(missing_mandatory)}. Required: {list(required_cols)}"
            )

        # Check vital feature presence
        present_features = [f for f in FEATURE_NAMES if f in df.columns]
        if len(present_features) < 3:
            raise HTTPException(
                status_code=422,
                detail=f"CSV must contain at least 3 valid vital features from: {FEATURE_NAMES}. Found: {present_features}"
            )

        # Validate target
        unique_targets = set(df["is_critical"].dropna().unique())
        if not unique_targets.issubset({0, 1, 0.0, 1.0}):
            raise HTTPException(
                status_code=422,
                detail=f"Target column 'is_critical' must only contain binary values 0 or 1. Found values: {list(unique_targets)}"
            )

        # Set synthetic flags
        df["is_synthetic"] = False
        df["synthetic_label"] = "DE-IDENTIFIED UPLOADED RESEARCH DATA"

        # Overwrite DB and retrain
        app_state.db.replace_records(df)
        app_state.pipeline.train_pipeline(df)
        app_state.sync_predictions_and_quality()

        return {
            "status": "success",
            "message": f"Successfully uploaded and ingested {len(df)} records. ML models retrained.",
            "total_records": len(df),
            "vital_features_present": present_features
        }

    return router
