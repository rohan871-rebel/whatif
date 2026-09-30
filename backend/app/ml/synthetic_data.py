"""
Realistic Synthetic Clinical Telemetry Cohort Generator.
Explicitly labeled: SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Tuple, List, Dict


FEATURE_NAMES = [
    "heart_rate",
    "spo2",
    "systolic_bp",
    "diastolic_bp",
    "respiratory_rate",
    "temperature"
]


def generate_synthetic_cohort(
    n_samples: int = 600,
    critical_ratio: float = 0.25,
    defect_ratio: float = 0.10,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates a synthetic telemetry dataset simulating physiological vital signs
    and known telemetry artifact modes.
    
    This dataset is strictly for software engineering testing and research simulation.
    It is NOT real clinical data.
    """
    rng = np.random.RandomState(random_seed)
    
    n_critical = int(n_samples * critical_ratio)
    n_non_critical = n_samples - n_critical
    
    now = datetime.now(timezone.utc)
    records = []
    
    # 1. Non-critical cohort (Stable ward / ambulatory physiological ranges)
    for i in range(n_non_critical):
        rec_id = f"SYN-REC-{1000 + i:04d}"
        
        # Correlated vitals for stable baseline
        hr = float(np.clip(rng.normal(74, 9), 52, 98))
        spo2 = float(np.clip(rng.normal(97.8, 1.2), 94.0, 100.0))
        sbp = float(np.clip(rng.normal(118, 10), 96, 138))
        dbp = float(np.clip(sbp * 0.65 + rng.normal(0, 4), 60, 88))
        rr = float(np.clip(rng.normal(15.5, 2.2), 11, 20))
        temp = float(np.clip(rng.normal(36.8, 0.3), 36.1, 37.4))
        
        # Timestamps spread over the past 3 hours
        minutes_ago = rng.uniform(2, 180)
        ts = (now - timedelta(minutes=minutes_ago)).strftime("%Y-%m-%d %H:%M:%S")
        
        records.append({
            "record_id": rec_id,
            "timestamp": ts,
            "heart_rate": round(hr, 1),
            "spo2": round(spo2, 1),
            "systolic_bp": round(sbp, 1),
            "diastolic_bp": round(dbp, 1),
            "respiratory_rate": round(rr, 1),
            "temperature": round(temp, 1),
            "is_critical": 0,
            "is_synthetic": True,
            "synthetic_label": "SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE"
        })
        
    # 2. Critical cohort (Simulating septic shock, acute respiratory compromise, cardiogenic collapse)
    phenotypes = ["septic_shock", "respiratory_failure", "hypertensive_crisis", "cardiogenic_bradycardia"]
    
    for j in range(n_critical):
        rec_id = f"SYN-REC-{2000 + j:04d}"
        phenotype = phenotypes[j % len(phenotypes)]
        
        if phenotype == "septic_shock":
            # Tachycardia, hypotension, tachypnea, severe fever or hypothermia
            hr = float(np.clip(rng.normal(124, 12), 105, 160))
            sbp = float(np.clip(rng.normal(78, 8), 58, 88))
            dbp = float(np.clip(sbp * 0.60 + rng.normal(0, 3), 38, 55))
            rr = float(np.clip(rng.normal(29, 4), 24, 40))
            temp = float(rng.choice([rng.normal(39.3, 0.5), rng.normal(35.2, 0.4)]))
            spo2 = float(np.clip(rng.normal(92, 3), 85, 96))
        elif phenotype == "respiratory_failure":
            # Marked desaturation, extreme tachypnea, secondary tachycardia
            spo2 = float(np.clip(rng.normal(83, 4.5), 72, 89))
            rr = float(np.clip(rng.normal(34, 4.0), 26, 46))
            hr = float(np.clip(rng.normal(118, 14), 98, 150))
            sbp = float(np.clip(rng.normal(132, 16), 100, 160))
            dbp = float(np.clip(sbp * 0.64 + rng.normal(0, 5), 65, 95))
            temp = float(np.clip(rng.normal(37.3, 0.6), 36.4, 38.5))
        elif phenotype == "hypertensive_crisis":
            # Dangerous systolic / diastolic elevations
            sbp = float(np.clip(rng.normal(198, 14), 180, 235))
            dbp = float(np.clip(rng.normal(116, 8), 104, 135))
            hr = float(np.clip(rng.normal(96, 12), 75, 125))
            rr = float(np.clip(rng.normal(21, 3.0), 16, 28))
            spo2 = float(np.clip(rng.normal(96, 1.5), 92, 99))
            temp = float(np.clip(rng.normal(36.9, 0.4), 36.2, 37.6))
        else: # cardiogenic bradycardia
            hr = float(np.clip(rng.normal(38, 5), 28, 46))
            sbp = float(np.clip(rng.normal(82, 9), 65, 94))
            dbp = float(np.clip(sbp * 0.60 + rng.normal(0, 4), 42, 60))
            rr = float(np.clip(rng.normal(18, 3), 12, 24))
            spo2 = float(np.clip(rng.normal(91, 3), 84, 95))
            temp = float(np.clip(rng.normal(36.2, 0.5), 35.0, 37.0))
            
        minutes_ago = rng.uniform(1, 120)
        ts = (now - timedelta(minutes=minutes_ago)).strftime("%Y-%m-%d %H:%M:%S")
        
        records.append({
            "record_id": rec_id,
            "timestamp": ts,
            "heart_rate": round(hr, 1),
            "spo2": round(spo2, 1),
            "systolic_bp": round(sbp, 1),
            "diastolic_bp": round(dbp, 1),
            "respiratory_rate": round(rr, 1),
            "temperature": round(temp, 1),
            "is_critical": 1,
            "is_synthetic": True,
            "synthetic_label": "SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE"
        })
        
    df = pd.DataFrame(records)
    
    # Shuffle
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    
    # 3. Inject controlled real-world data quality issues into a subset
    n_defects = int(n_samples * defect_ratio)
    defect_indices = rng.choice(df.index, size=n_defects, replace=False)
    
    for idx in defect_indices:
        defect_type = rng.choice(["missing_spo2", "stale_timestamp", "sensor_spike_hr", "drop_bp"])
        if defect_type == "missing_spo2":
            df.loc[idx, "spo2"] = np.nan
        elif defect_type == "stale_timestamp":
            # Set timestamp to 4 to 18 hours ago
            stale_min = rng.uniform(240, 1080)
            df.loc[idx, "timestamp"] = (now - timedelta(minutes=stale_min)).strftime("%Y-%m-%d %H:%M:%S")
        elif defect_type == "sensor_spike_hr":
            # Motion artifact spike
            df.loc[idx, "heart_rate"] = 245.0
        elif defect_type == "drop_bp":
            df.loc[idx, "systolic_bp"] = np.nan
            df.loc[idx, "diastolic_bp"] = np.nan
            
    return df
