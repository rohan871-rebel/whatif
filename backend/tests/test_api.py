"""
Integration tests for FastAPI endpoints using TestClient with lifespan context.
Covers authentication, validation, CSV uploads, error handling, and AI agent routes.
"""

import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml.synthetic_data import generate_synthetic_cohort


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Research demonstration only" in data["disclaimer"]
    assert data["models_trained"] is True


def test_api_dashboard_summary(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] > 0
    assert "heart_rate" in data["vitals_distributions"]
    assert ("SYNTHETIC DEMO DATA" in data["synthetic_label"] or "RESEARCH DATA" in data["synthetic_label"])


def test_api_records_list(client):
    res = client.get("/api/records?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) <= 10
    assert data["total"] > 0


def test_api_record_detail(client):
    # Fetch list first to get an existing ID
    list_res = client.get("/api/records?limit=1")
    assert list_res.status_code == 200
    first_id = list_res.json()["records"][0]["record_id"]

    res = client.get(f"/api/records/{first_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["record_id"] == first_id
    assert "quality_warnings" in data


def test_api_record_detail_404(client):
    res = client.get("/api/records/NON_EXISTENT_ID_99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_api_model_comparison(client):
    res = client.get("/api/models/comparison?threshold=0.50")
    assert res.status_code == 200
    data = res.json()
    assert "baseline_model" in data
    assert "ga_model" in data
    assert data["baseline_model"]["auroc"] >= 0.50
    assert len(data["ga_model"]["selected_feature_names"]) >= 2
    # Verify false negative tracking
    assert "false_negative_rate" in data["baseline_model"]
    assert "false_negative_count" in data["baseline_model"]
    assert "mean_absolute_score_change" in data["baseline_model"]


def test_api_what_if_simulator(client):
    req = {
        "record_id": "SYN-REC-1001",
        "vitals": {
            "heart_rate": 75.0,
            "spo2": 98.0,
            "systolic_bp": 120.0,
            "diastolic_bp": 80.0,
            "respiratory_rate": 16.0,
            "temperature": 37.0
        },
        "noise_std": 0.35,
        "dropped_fields": ["spo2"],
        "timestamp_stale_minutes": 60,
        "custom_notes": "Test simulated dropout and noise"
    }
    res = client.post("/api/simulator/what-if", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["record_id"] == "SYN-REC-1001"
    assert "delta_baseline" in data
    assert "plain_language_explanation" in data
    assert "is_false_negative" in data
    assert "is_false_positive" in data
    assert "prediction_change_magnitude" in data
    assert len(data["affected_features"]) > 0


def test_api_what_if_simulator_invalid_inputs(client):
    # Noise standard deviation out of bounds (> 1.0)
    req = {
        "record_id": "SYN-REC-1001",
        "vitals": {"heart_rate": 80.0},
        "noise_std": 2.5
    }
    res = client.post("/api/simulator/what-if", json=req)
    assert res.status_code == 422


def test_api_sample_csv_download(client):
    res = client.get("/api/records/sample-csv")
    assert res.status_code == 200
    assert "text/plain" in res.headers.get("content-type", "")
    assert "record_id,timestamp" in res.text


def test_api_csv_upload_valid(client):
    # Create valid synthetic dataset of 25 rows
    df = generate_synthetic_cohort(n_samples=25, random_seed=77)
    csv_buf = io.StringIO()
    df.to_csv(csv_buf, index=False)
    csv_bytes = csv_buf.getvalue().encode("utf-8")

    files = {"file": ("test_cohort.csv", csv_bytes, "text/csv")}
    res = client.post("/api/records/upload-csv", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_records"] == 25


def test_api_csv_upload_reject_non_csv(client):
    files = {"file": ("payload.txt", b"invalid text content", "text/plain")}
    res = client.post("/api/records/upload-csv", files=files)
    assert res.status_code == 400
    assert "Only CSV files" in res.json()["detail"]


def test_api_csv_upload_reject_missing_mandatory(client):
    # CSV missing 'is_critical'
    csv_data = "record_id,timestamp,heart_rate,spo2\nREC-1,2026-09-30 10:00:00,75,98\n"
    files = {"file": ("bad_schema.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/records/upload-csv", files=files)
    assert res.status_code == 422
    assert "missing mandatory columns" in res.json()["detail"]


def test_api_csv_upload_reject_too_few_rows(client):
    # CSV with only 3 rows (< MIN_CSV_ROWS of 20)
    csv_data = (
        "record_id,timestamp,heart_rate,spo2,systolic_bp,is_critical\n"
        "REC-1,2026-09-30 10:00:00,75,98,120,0\n"
        "REC-2,2026-09-30 10:05:00,80,97,122,1\n"
        "REC-3,2026-09-30 10:10:00,78,99,118,0\n"
    )
    files = {"file": ("too_few.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/records/upload-csv", files=files)
    assert res.status_code == 422
    assert "at least 20 rows" in res.json()["detail"]


def test_api_csv_upload_reject_single_class(client):
    # 25 rows but all is_critical=0
    df = generate_synthetic_cohort(n_samples=25, random_seed=88)
    df["is_critical"] = 0
    csv_buf = io.StringIO()
    df.to_csv(csv_buf, index=False)

    files = {"file": ("single_class.csv", csv_buf.getvalue().encode("utf-8"), "text/csv")}
    res = client.post("/api/records/upload-csv", files=files)
    assert res.status_code == 422
    assert "both critical" in res.json()["detail"]


def test_api_data_quality_report(client):
    res = client.get("/api/data-quality/report")
    assert res.status_code == 200
    data = res.json()
    assert "total_checked" in data
    assert "clean_count" in data
    assert "warning_count" in data
    assert "rule_configs" in data


def test_api_data_quality_rules_update(client):
    rule = {
        "rule_id": "RULE_HR_PLAUSIBLE",
        "field": "heart_rate",
        "name": "Heart Rate Bounds Check",
        "min_plausible": 35.0,
        "max_plausible": 235.0,
        "severity": "CRITICAL",
        "description": "Custom research rule boundary",
        "enabled": True
    }
    res = client.put("/api/data-quality/rules", json=rule)
    assert res.status_code == 200
    rules = res.json()
    updated = next(r for r in rules if r["rule_id"] == "RULE_HR_PLAUSIBLE")
    assert updated["max_plausible"] == 235.0


def test_api_experiments_and_csv_export(client):
    res = client.get("/api/experiments?limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    csv_res = client.get("/api/experiments/export-csv")
    assert csv_res.status_code == 200
    assert "experiment_id" in csv_res.text


def test_api_ai_discovery_endpoints(client):
    robots_res = client.get("/robots.txt")
    assert robots_res.status_code == 200
    assert "GPTBot" in robots_res.text

    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    assert "openapi" in openapi_res.json()
