"""
Integration tests for FastAPI endpoints using TestClient with lifespan context.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


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


def test_api_dashboard_summary(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] > 0
    assert "heart_rate" in data["vitals_distributions"]
    assert "SYNTHETIC DEMO DATA" in data["synthetic_label"]


def test_api_records_list(client):
    res = client.get("/api/records?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) <= 10
    assert data["total"] > 0


def test_api_model_comparison(client):
    res = client.get("/api/models/comparison?threshold=0.50")
    assert res.status_code == 200
    data = res.json()
    assert "baseline_model" in data
    assert "ga_model" in data
    assert data["baseline_model"]["auroc"] >= 0.50
    assert len(data["ga_model"]["selected_feature_names"]) >= 2


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
    assert len(data["affected_features"]) > 0


def test_api_experiments_and_csv_export(client):
    res = client.get("/api/experiments?limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    csv_res = client.get("/api/experiments/export-csv")
    assert csv_res.status_code == 200
    assert "experiment_id" in csv_res.text
