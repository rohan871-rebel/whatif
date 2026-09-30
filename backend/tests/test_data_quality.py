"""
Unit tests for data quality monitor and research rules.
"""

from app.ml.data_quality import DataQualityMonitor


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
    warnings = monitor.audit_record(clean_rec)
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
