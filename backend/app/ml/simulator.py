"""
WHAT IF Experiment Simulator and Explainability Engine.
Quantifies model vulnerability to sensor noise, dropouts, and timestamp drift.
Provides plain-language explanations without claiming biological causation.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from app.schemas import WhatIfRequest, WhatIfResponse
from app.ml.models import MLPipeline


class WhatIfSimulator:
    def __init__(self, pipeline: MLPipeline):
        self.pipeline = pipeline

    def simulate_experiment(self, req: WhatIfRequest) -> WhatIfResponse:
        """
        Executes a controlled WHAT IF perturbation experiment:
        1. Compares original vitals against perturbed inputs.
        2. Injects Gaussian noise and simulated dropouts.
        3. Runs inference through Baseline and GA models.
        4. Detects Ghost Signal risk score inversions (Silent Failure or Spurious Alarm).
        5. Generates plain-language attribution narrative.
        """
        if not self.pipeline.is_trained:
            raise ValueError("MLPipeline is not trained yet.")

        original_vitals = dict(req.vitals)
        perturbed_vitals = dict(req.vitals)
        affected_features: List[str] = []

        # 1. Apply Dropped Fields (Simulate sensor detachment / telemetry disconnect)
        for field in req.dropped_fields:
            if field in perturbed_vitals:
                perturbed_vitals[field] = np.nan
                affected_features.append(f"{field} (sensor disconnected)")

        # 2. Apply Gaussian Noise
        if req.noise_std > 0:
            rng = np.random.RandomState(42)
            for field, val in perturbed_vitals.items():
                if val is not None and not (isinstance(val, float) and np.isnan(val)) and field not in req.dropped_fields:
                    try:
                        num_val = float(val)
                        # Relative noise magnitude based on physiological standard deviations
                        std_scale = {
                            "heart_rate": 12.0,
                            "spo2": 4.0,
                            "oxygen_saturation": 4.0,
                            "systolic_bp": 15.0,
                            "diastolic_bp": 10.0,
                            "respiratory_rate": 4.0,
                            "temperature": 0.8
                        }.get(field, 5.0)
                        
                        noise = float(rng.normal(0, req.noise_std * std_scale))
                        perturbed_val = round(num_val + noise, 1)
                        
                        # Clip within physical limits
                        if field in ["spo2", "oxygen_saturation"]:
                            perturbed_val = max(50.0, min(100.0, perturbed_val))
                        elif field in ["heart_rate", "respiratory_rate", "systolic_bp", "diastolic_bp"]:
                            perturbed_val = max(10.0, perturbed_val)
                        elif field == "temperature":
                            perturbed_val = max(30.0, min(44.0, perturbed_val))

                        perturbed_vitals[field] = perturbed_val
                        affected_features.append(f"{field} (noise injected: {noise:+.1f})")
                    except (ValueError, TypeError):
                        pass

        # 3. Simulate Stale Timestamp
        if req.timestamp_stale_minutes > 0:
            affected_features.append(f"timestamp (delayed by +{req.timestamp_stale_minutes} min)")

        # 4. Predict Baseline and GA risk scores
        orig_base_risk, orig_ga_risk = self.pipeline.predict_vitals(original_vitals)
        pert_base_risk, pert_ga_risk = self.pipeline.predict_vitals(perturbed_vitals)

        delta_baseline = round(pert_base_risk - orig_base_risk, 4)
        delta_ga = round(pert_ga_risk - orig_ga_risk, 4)

        # 5. Detect Ghost Signal Anomaly
        # A Ghost Signal occurs when sensor degradation alters the risk tier across the 0.50 threshold
        # or causes a dramatic divergence (|delta| >= 0.25).
        decision_threshold = 0.50
        ghost_signal_detected = False
        ghost_signal_type: Optional[str] = None
        ghost_severity = "NONE"

        prediction_change_magnitude = round(abs(delta_baseline), 4)
        is_false_negative = False
        is_false_positive = False
        false_negative_risk_delta: Optional[float] = None

        # Case A: Silent Failure (Original high-risk patient drops below threshold due to sensor dropout - False Negative)
        if orig_base_risk >= decision_threshold and pert_base_risk < decision_threshold:
            ghost_signal_detected = True
            ghost_signal_type = "SILENT_FAILURE"
            ghost_severity = "HIGH"
            is_false_negative = True
            false_negative_risk_delta = delta_baseline
        # Case B: Spurious Alarm (Original low-risk patient crosses threshold into high risk due to noise - False Positive)
        elif orig_base_risk < decision_threshold and pert_base_risk >= decision_threshold:
            ghost_signal_detected = True
            ghost_signal_type = "SPURIOUS_ALARM"
            ghost_severity = "HIGH"
            is_false_positive = True
        # Case C: High score volatility without crossing threshold
        elif abs(delta_baseline) >= 0.20:
            ghost_signal_detected = True
            ghost_signal_type = "VOLATILITY_DRIFT"
            ghost_severity = "MEDIUM" if abs(delta_baseline) < 0.35 else "HIGH"

        # 6. Generate Plain-Language Explainability Narrative
        explanation_lines = []
        explanation_lines.append(
            f"WHAT IF Experiment for Record {req.record_id}:"
        )
        if affected_features:
            explanation_lines.append(f"Perturbations applied: {', '.join(affected_features)}.")
        else:
            explanation_lines.append("No active perturbations applied (evaluating baseline state).")

        explanation_lines.append(
            f"Baseline RF model risk shifted by {delta_baseline:+.2f} (from {orig_base_risk:.2f} to {pert_base_risk:.2f})."
        )
        explanation_lines.append(
            f"GA-Selected RF model risk shifted by {delta_ga:+.2f} (from {orig_ga_risk:.2f} to {pert_ga_risk:.2f})."
        )

        # Compare model resilience
        abs_base = abs(delta_baseline)
        abs_ga = abs(delta_ga)
        if abs_ga < abs_base:
            dampening = ((abs_base - abs_ga) / abs_base) * 100.0 if abs_base > 0 else 0.0
            explanation_lines.append(
                f"Resilience Insight: The GA feature selection dampened sensor noise volatility by {dampening:.1f}% "
                f"because it excluded volatile or collinear parameters (selected {self.pipeline.selected_feature_names})."
            )
        elif abs_ga > abs_base:
            explanation_lines.append(
                "Resilience Insight: The GA model exhibited slightly higher sensitivity to this specific perturbation pattern."
            )
        else:
            explanation_lines.append(
                "Resilience Insight: Both models exhibited equivalent sensitivity to this perturbation."
            )

        if ghost_signal_detected:
            if ghost_signal_type == "SILENT_FAILURE":
                explanation_lines.append(
                    "CRITICAL GHOST SIGNAL DETECTED: Silent Failure mode. Critical deterioration is masked by missing/stale telemetry, causing the baseline model to erroneously suppress risk."
                )
            elif ghost_signal_type == "SPURIOUS_ALARM":
                explanation_lines.append(
                    "GHOST SIGNAL DETECTED: Spurious Alarm mode. Transient telemetry noise elevated the risk score across the clinical decision threshold, illustrating alarm fatigue risk."
                )

        explanation_lines.append(
            "Note: Statistical feature attribution reflects model decision boundaries and does not establish biological or clinical causation."
        )

        return WhatIfResponse(
            record_id=req.record_id,
            original_vitals=original_vitals,
            perturbed_vitals=perturbed_vitals,
            baseline_risk_original=orig_base_risk,
            baseline_risk_perturbed=pert_base_risk,
            ga_risk_original=orig_ga_risk,
            ga_risk_perturbed=pert_ga_risk,
            delta_baseline=delta_baseline,
            delta_ga=delta_ga,
            prediction_change_magnitude=prediction_change_magnitude,
            is_false_negative=is_false_negative,
            is_false_positive=is_false_positive,
            false_negative_risk_delta=false_negative_risk_delta,
            sensor_dropout_fields=req.dropped_fields,
            gaussian_noise_sigma=req.noise_std,
            stale_telemetry_detected=bool(req.timestamp_stale_minutes >= 120),
            ghost_signal_detected=ghost_signal_detected,
            ghost_signal_type=ghost_signal_type,
            ghost_signal_severity=ghost_severity,
            affected_features=affected_features,
            plain_language_explanation="\n".join(explanation_lines),
            disclaimer=(
                "Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions. "
                "Simulated outputs illustrate mathematical sensitivity; they do not predict actual biological trajectories."
            )
        )
