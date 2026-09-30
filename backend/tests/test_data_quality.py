"""
Unit tests for data quality monitor, boundary checks, and research rules.
"""

from datetime import datetime, timezone, timedelta
from app.ml.data_quality import DataQualityMonitor
from app.schemas import RuleConfig


def test_data_quality_clean_record():
    monitor = DataQualityMonitor()
    clean_rec = {
        "record_id": "TEST-001",
        "timestamp": "2026-09-30 10:00:00",
        "heart_rate": 72.0,
        "spo2": 98.0,
        "systolic_bp": 118.0,
        "diastolic_bp": 76.0,
        "respiratory_rate": 16.0,
        "temperature": 36.8
    }
    # Pass reference time close to timestamp
    ref_time = datetime(2026, 9, 30, 10, 15, 0)
    warnings = monitor.audit_record(clean_rec, reference_time=ref_time)
    assert len(warnings) == 0


def test_data_quality_missing_vital():
    monitor = DataQualityMonitor()
    rec = {
        "record_id": "TEST-002",
        "timestamp": "2026-09-30 10:00:00",
        "heart_rate": 80.0,
        "spo2": None,  # Detached pulse ox
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "respiratory_rate": 16.0,
        "temperature": 37.0
    }
    warnings = monitor.audit_record(rec)
    assert any(w.field == "spo2" and w.rule_id == "RULE_MISSING_VALUE" for w in warnings)


def test_data_quality_implausible_reading():
    monitor = DataQualityMonitor()
    rec = {
        "record_id": "TEST-003",
        "timestamp": "2026-09-30 10:00:00",
        "heart_rate": 255.0,  # Extreme motion spike
        "spo2": 42.0,         # Severe artifact/detachment
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "respiratory_rate": 16.0,
        "temperature": 37.0
    }
    warnings = monitor.audit_record(rec)
    assert any(w.field == "heart_rate" and w.rule_id == "RULE_HR_PLAUSIBLE" for w in warnings)
    assert any(w.field == "spo2" and w.rule_id == "RULE_SPO2_PLAUSIBLE" for w in warnings)


def test_data_quality_pressure_inversion():
    monitor = DataQualityMonitor()
    rec = {
        "record_id": "TEST-004",
        "timestamp": "2026-09-30 10:00:00",
        "heart_rate": 75.0,
        "spo2": 98.0,
        "systolic_bp": 80.0,
        "diastolic_bp": 110.0,  # Inversion!
        "respiratory_rate": 16.0,
        "temperature": 37.0
    }
    warnings = monitor.audit_record(rec)
    assert any(w.rule_id == "RULE_PRESSURE_INVERSION" for w in warnings)


def test_data_quality_stale_timestamp():
    monitor = DataQualityMonitor()
    # Reading from 4 hours ago (240 minutes > 120 minute threshold)
    rec = {
        "record_id": "TEST-STALE-005",
        "timestamp": "2026-09-30 06:00:00",
        "heart_rate": 75.0,
        "spo2": 98.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "respiratory_rate": 16.0,
        "temperature": 37.0
    }
    ref_time = datetime(2026, 9, 30, 10, 30, 0)
    warnings = monitor.audit_record(rec, reference_time=ref_time)
    assert any(w.rule_id == "RULE_TIMESTAMP_STALENESS" for w in warnings)


def test_data_quality_oxygen_saturation_synonym():
    monitor = DataQualityMonitor()
    # Record provides oxygen_saturation instead of spo2
    rec = {
        "record_id": "TEST-OXYSAT-006",
        "timestamp": "2026-09-30 10:00:00",
        "heart_rate": 72.0,
        "oxygen_saturation": 97.5,
        "systolic_bp": 118.0,
        "diastolic_bp": 76.0,
        "respiratory_rate": 15.0,
        "temperature": 36.8
    }
    ref_time = datetime(2026, 9, 30, 10, 0, 0)
    warnings = monitor.audit_record(rec, reference_time=ref_time)
    # Should NOT trigger RULE_MISSING_VALUE for spo2
    assert not any(w.field == "spo2" and w.rule_id == "RULE_MISSING_VALUE" for w in warnings)


def test_data_quality_rule_enable_disable():
    monitor = DataQualityMonitor()
    # Disable HR rule
    hr_rule = next(r for r in monitor.rules if r.rule_id == "RULE_HR_PLAUSIBLE")
    hr_rule.enabled = False
    
    rec = {
        "record_id": "TEST-007",
        "timestamp": "2026-09-30 10:00:00",
        "heart_rate": 260.0,  # Out of bounds
        "spo2": 98.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "respiratory_rate": 16.0,
        "temperature": 37.0
    }
    warnings = monitor.audit_record(rec)
    assert not any(w.rule_id == "RULE_HR_PLAUSIBLE" for w in warnings)
