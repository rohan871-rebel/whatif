"""
Unit tests for WhatIfSimulator, Ghost Signal detection, and False Negative evaluation.
"""

import pytest
import numpy as np
import pandas as pd
from app.ml.synthetic_data import generate_synthetic_cohort
from app.ml.models import MLPipeline
from app.ml.simulator import WhatIfSimulator
from app.schemas import WhatIfRequest


@pytest.fixture(scope="module")
def trained_pipeline():
    df = generate_synthetic_cohort(n_samples=80, random_seed=42)
    pipeline = MLPipeline(random_seed=42)
    # Quick train
    pipeline.train_pipeline(df)
    return pipeline


def test_whatif_simulator_clean_baseline(trained_pipeline):
    simulator = WhatIfSimulator(trained_pipeline)
    req = WhatIfRequest(
        record_id="SIM-001",
        vitals={
            "heart_rate": 72.0,
            "spo2": 98.0,
            "systolic_bp": 120.0,
            "diastolic_bp": 80.0,
            "respiratory_rate": 16.0,
            "temperature": 36.8
        },
        noise_std=0.0,
        dropped_fields=[],
        timestamp_stale_minutes=0
    )
    res = simulator.simulate_experiment(req)
    assert res.record_id == "SIM-001"
    assert res.prediction_change_magnitude == 0.0
    assert not res.is_false_negative
    assert not res.is_false_positive
    assert res.ghost_signal_severity == "NONE"
    assert "No active perturbations applied" in res.plain_language_explanation


def test_whatif_simulator_silent_failure_false_negative(trained_pipeline):
    simulator = WhatIfSimulator(trained_pipeline)
    # Critical decompensating patient with high risk
    vitals_critical = {
        "heart_rate": 135.0,
        "spo2": 82.0,
        "systolic_bp": 72.0,
        "diastolic_bp": 42.0,
        "respiratory_rate": 34.0,
        "temperature": 39.2
    }
    # Simulate pulse oximeter probe dropout (finger sensor detached)
    req = WhatIfRequest(
        record_id="SIM-CRIT-002",
        vitals=vitals_critical,
        noise_std=0.20,
        dropped_fields=["spo2"],
        timestamp_stale_minutes=45
    )
    res = simulator.simulate_experiment(req)
    assert res.record_id == "SIM-CRIT-002"
    assert res.prediction_change_magnitude >= 0.0
    assert "spo2 (sensor disconnected)" in res.affected_features
    assert "timestamp (delayed by +45 min)" in res.affected_features
    # Check that explanation contains epistemic guardrails
    assert "Note: Statistical feature attribution" in res.plain_language_explanation
    assert "Research demonstration only" in res.disclaimer


def test_whatif_simulator_spurious_alarm_noise_spike(trained_pipeline):
    simulator = WhatIfSimulator(trained_pipeline)
    # Healthy stable patient
    vitals_stable = {
        "heart_rate": 70.0,
        "spo2": 99.0,
        "systolic_bp": 118.0,
        "diastolic_bp": 76.0,
        "respiratory_rate": 14.0,
        "temperature": 36.7
    }
    # Inject heavy noise
    req = WhatIfRequest(
        record_id="SIM-NOISE-003",
        vitals=vitals_stable,
        noise_std=0.80,
        dropped_fields=[],
        timestamp_stale_minutes=0
    )
    res = simulator.simulate_experiment(req)
    assert res.record_id == "SIM-NOISE-003"
    assert res.prediction_change_magnitude >= 0.0
    assert len(res.affected_features) > 0


def test_whatif_simulator_reproducible_output(trained_pipeline):
    simulator = WhatIfSimulator(trained_pipeline)
    vitals = {
        "heart_rate": 88.0,
        "spo2": 94.0,
        "systolic_bp": 110.0,
        "diastolic_bp": 70.0,
        "respiratory_rate": 20.0,
        "temperature": 37.5
    }
    req1 = WhatIfRequest(record_id="SIM-REP", vitals=vitals, noise_std=0.30)
    req2 = WhatIfRequest(record_id="SIM-REP", vitals=vitals, noise_std=0.30)
    res1 = simulator.simulate_experiment(req1)
    res2 = simulator.simulate_experiment(req2)
    assert res1.baseline_risk_perturbed == res2.baseline_risk_perturbed
    assert res1.ga_risk_perturbed == res2.ga_risk_perturbed
    assert res1.delta_baseline == res2.delta_baseline
