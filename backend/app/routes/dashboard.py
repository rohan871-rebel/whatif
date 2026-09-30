"""
Dashboard Overview API Routes.
Provides cohort metrics, vital-sign distributions, and latest experiment logs.
"""

from fastapi import APIRouter
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple

from app.schemas import DashboardSummary, ExperimentRecord
from app.config import RESEARCH_DISCLAIMER, SYNTHETIC_DATA_LABEL

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _calculate_distributions(df: pd.DataFrame) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, List[Dict[str, Any]]]]:
    vitals_dist: Dict[str, List[Dict[str, Any]]] = {}
    
    # 1. Vital-sign binned histograms
    configs = {
        "heart_rate": (40, 180, 10, "bpm"),
        "spo2": (70, 100, 3, "%"),
        "systolic_bp": (60, 220, 15, "mmHg"),
        "respiratory_rate": (8, 45, 3, "bpm"),
        "temperature": (34.0, 41.0, 0.5, "°C")
    }

    for col, (min_v, max_v, step, unit) in configs.items():
        if col in df.columns:
            valid_vals = df[col].dropna().values
            if len(valid_vals) > 0:
                bins = np.arange(min_v, max_v + step, step)
                counts, edges = np.histogram(valid_vals, bins=bins)
                vitals_dist[col] = [
                    {
                        "bin": f"{round(edges[i], 1)}-{round(edges[i+1], 1)} {unit}",
                        "count": int(counts[i]),
                        "low": round(float(edges[i]), 1),
                        "high": round(float(edges[i+1]), 1)
                    }
                    for i in range(len(counts))
                ]

    # 2. Risk-score distributions (0.0 to 1.0 in 0.1 bins)
    risk_dist: Dict[str, List[Dict[str, Any]]] = {"baseline_risk": [], "ga_risk": []}
    risk_bins = np.linspace(0.0, 1.0, 11)
    for risk_col in ["baseline_risk", "ga_risk"]:
        if risk_col in df.columns:
            valid_risks = df[risk_col].dropna().values
            if len(valid_risks) > 0:
                counts, edges = np.histogram(valid_risks, bins=risk_bins)
                risk_dist[risk_col] = [
                    {
                        "range": f"{round(edges[i], 2)}-{round(edges[i+1], 2)}",
                        "count": int(counts[i]),
                        "tier": "Critical Risk" if edges[i] >= 0.5 else "Non-Critical"
                    }
                    for i in range(len(counts))
                ]

    return vitals_dist, risk_dist


def create_dashboard_router(app_state) -> APIRouter:

    @router.get("/summary", response_model=DashboardSummary)
    def get_dashboard_summary():
        df = app_state.db.get_records_df()
        
        total_records = len(df)
        critical_records = int(df["is_critical"].sum()) if not df.empty and "is_critical" in df.columns else 0
        
        # Quality counts
        clean_count = int((df["quality_status"] == "CLEAN").sum()) if not df.empty and "quality_status" in df.columns else 0
        warning_count = int((df["quality_status"] == "WARNING").sum()) if not df.empty and "quality_status" in df.columns else 0
        defect_count = int((df["quality_status"] == "DEFECT").sum()) if not df.empty and "quality_status" in df.columns else 0

        # Model evaluation metrics
        baseline_auroc = 0.0
        ga_auroc = 0.0
        robustness_gain = 0.0
        
        if app_state.pipeline.is_trained:
            try:
                base_eval = app_state.pipeline.evaluate_model(is_ga=False)
                ga_eval = app_state.pipeline.evaluate_model(is_ga=True)
                baseline_auroc = base_eval["auroc"]
                ga_auroc = ga_eval["auroc"]
                
                masc_base = base_eval["mean_absolute_score_change"]
                masc_ga = ga_eval["mean_absolute_score_change"]
                if masc_base > 0:
                    robustness_gain = round(((masc_base - masc_ga) / masc_base) * 100.0, 1)
            except Exception:
                pass

        # Distributions
        vitals_dist, risk_dist = _calculate_distributions(df) if not df.empty else ({}, {})

        # Latest experiments
        recent_exps = app_state.db.get_experiments(limit=5)
        parsed_exps = [ExperimentRecord(**r) for r in recent_exps]

        is_synthetic = bool(df["is_synthetic"].iloc[0]) if not df.empty and "is_synthetic" in df.columns else True

        return DashboardSummary(
            total_records=total_records,
            critical_records=critical_records,
            clean_records=clean_count,
            warning_records=warning_count,
            defect_records=defect_count,
            baseline_auroc=baseline_auroc,
            ga_auroc=ga_auroc,
            mean_robustness_delta=robustness_gain,
            latest_experiments=parsed_exps,
            vitals_distributions=vitals_dist,
            risk_distributions=risk_dist,
            is_synthetic=is_synthetic,
            synthetic_label=SYNTHETIC_DATA_LABEL if is_synthetic else "DE-IDENTIFIED RESEARCH DATA",
            disclaimer=RESEARCH_DISCLAIMER
        )

    return router
