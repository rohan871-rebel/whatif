"""
WHAT IF Simulator API Routes.
Controlled perturbation experiments and ghost signal detection.
"""

from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime, timezone

from app.schemas import WhatIfRequest, WhatIfResponse

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])


def create_simulator_router(app_state) -> APIRouter:

    @router.post("/what-if", response_model=WhatIfResponse)
    def run_what_if_experiment(req: WhatIfRequest):
        # 1. Validation checks on inputs
        for field, val in req.vitals.items():
            if val is not None:
                if field in ["heart_rate", "respiratory_rate", "systolic_bp", "diastolic_bp"] and val < 0:
                    raise HTTPException(
                        status_code=422,
                        detail=f"Invalid physiological input: {field} cannot be negative ({val})."
                    )
                if field in ["spo2", "oxygen_saturation"] and (val < 0 or val > 100):
                    raise HTTPException(
                        status_code=422,
                        detail=f"Invalid physiological input: {field} must be between 0 and 100% ({val})."
                    )

        # 2. Run simulation
        res = app_state.simulator.simulate_experiment(req)

        # 3. Log to experiment history
        perturbation_parts = []
        if req.noise_std > 0:
            perturbation_parts.append(f"Noise {int(req.noise_std * 100)}%")
        if req.dropped_fields:
            perturbation_parts.append(f"Dropped [{', '.join(req.dropped_fields)}]")
        if req.timestamp_stale_minutes > 0:
            perturbation_parts.append(f"Stale +{req.timestamp_stale_minutes}m")
        perturbation_type = " + ".join(perturbation_parts) if perturbation_parts else "Vital Modification"

        exp_data = {
            "experiment_id": f"EXP-{uuid.uuid4().hex[:8].upper()}",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "record_id": req.record_id,
            "perturbation_type": perturbation_type,
            "noise_std": req.noise_std,
            "dropped_fields": req.dropped_fields,
            "stale_minutes": req.timestamp_stale_minutes,
            "baseline_before": res.baseline_risk_original,
            "baseline_after": res.baseline_risk_perturbed,
            "ga_before": res.ga_risk_original,
            "ga_after": res.ga_risk_perturbed,
            "delta_baseline": res.delta_baseline,
            "delta_ga": res.delta_ga,
            "ghost_signal_type": res.ghost_signal_type,
            "notes": req.custom_notes
        }
        app_state.db.log_experiment(exp_data)

        return res

    return router
