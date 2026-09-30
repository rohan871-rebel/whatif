# GHOST SIGNAL — WHAT IF?
### Biomedical AI Reliability Research & Telemetry Simulation Platform
**Built for the Optic Forge Hackathon**

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Research Demonstration Only**: Not for diagnosis, triage, treatment, or real-patient decisions. Risk scores are uncalibrated statistical model outputs and must not be interpreted as validated clinical probabilities.

---

## 1. Executive Summary & Problem Statement

Modern intensive care units and high-acuity wards deploy continuous telemetry streams (heart rate, pulse oximetry, non-invasive blood pressure, respiratory rate, and core temperature) into machine learning early-warning algorithms. 

However, real hospital telemetry is notoriously noisy:
- **Loose Sensor Detachment**: Diaphoretic patients lose finger pulse oximeter contact; naive ML pipelines impute normal cohort medians (98% $\text{SpO}_2$), creating a **Silent Failure** where critical respiratory collapse is hidden from nurses.
- **Motion Artifacts & Shivering**: Patient movement or shivering induces high-frequency impedance spikes (e.g., transient 245 bpm recordings), triggering **Spurious Alarms** that drive severe hospital alarm fatigue.
- **Stale Telemetry Buffers**: Asynchronous edge buffers cache old readings without timestamp validation, computing risk scores on obsolete physiological states.

**GHOST SIGNAL — WHAT IF?** is a full-stack biomedical AI reliability research lab. It provides clinicians, researchers, and hackathon judges with a sandboxed environment to inject controlled noise, dropouts, and timestamp drift, directly demonstrating how an all-feature baseline Random Forest fails and how a **Genetic Algorithm (GA) feature-selection mask** mitigates spurious volatility.

---

## 2. Key Pages and System Features

| Module | Core Functionality | Reliability Impact |
| :--- | :--- | :--- |
| **Landing Page** | Project mission, animated HTML5 ECG lead II waveform, and SDG mapping. | High-level research framing and problem motivation. |
| **Dashboard** | Total cohort metrics, telemetry defect counts, vital sign distributions, and baseline vs GA score spectrums. | Real-time overview of cohort quality and model discrimination. |
| **Record Explorer** | Anonymized record search, filtering by quality status/acuity, sorting, detailed physiological radar charts, and sample CSV download. | Complete visibility into individual patient telemetry streams without PHI leakage. |
| **Data Quality Monitor** | Real-time detection of implausible ranges, pressure inversions ($\text{DBP} \ge \text{SBP}$), missingness, and stale buffers ($>120\text{m}$). Includes an interactive rule config editor. | Enforces configurable research rules (clearly separated from universal clinical standards). |
| **WHAT IF Simulator** | Interactive vital sliders, Gaussian sensor noise injection ($\sigma \in [0, 100\%]$), sensor detachment dropout checkboxes, and timestamp staleness drift. | Quantifies score migration ($|\Delta\text{Score}|$) and alerts on **Silent Failures** or **Spurious Alarms**. |
| **Model Comparison** | Rigorous evaluation of Baseline RF vs GA-selected RF on held-out test data (AUROC, Sensitivity/Recall, False Negative Rate, MASC under perturbation, and ROC curves). | Evaluates robustness tradeoffs across an interactive decision threshold ($\tau \in [0.1, 0.9]$). |
| **Experiment History** | Persistent run audit log recording perturbations, baseline shift, GA shift, and ghost signal classification with one-click CSV export. | Full reproducibility and experiment tracking for research reports. |
| **Explainability** | Plain-language feature attribution narratives detailing which inputs moved and why the GA model resisted noise. | Explicitly educates that statistical feature importance does not establish biological causation. |
| **Methodology** | Mathematical formulation of the multi-objective GA fitness function, train/val/test splits, and preprocessing leakage guards. | Academic transparency for technical review. |
| **SDG Alignment** | In-depth alignment with **SDG 3** (Good Health & Well-Being) and **SDG 9** (Industry, Innovation & Infrastructure), with a future roadmap for **SDG 10** (Subgroup Fairness). | Ethical and societal framing without unsubstantiated clinical impact claims. |

---

## 3. Technology Stack

- **Backend**: Python 3.10+ / FastAPI, Uvicorn, Pydantic v2
- **Machine Learning**: scikit-learn (`RandomForestClassifier`), NumPy, pandas, SciPy
- **Persistence**: SQLite (`ghost_signal.db`) for cohort persistence and experiment run tracking
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **Testing**: Pytest, FastAPI TestClient, httpx

---

## 4. Machine Learning & Genetic Algorithm Architecture

### A. Leakage-Free Preprocessing Pipeline
To prevent optimistic bias and data leakage:
1. Cohort records are partitioned into **60% Training**, **20% Validation**, and **20% Held-Out Test** (stratified by critical event status).
2. Imputation medians and scaling parameters (`RobustScaler`) are **fitted strictly on the Training set**.
3. Validation and held-out test splits are transformed using pre-fitted training statistics only.

### B. Genetic Algorithm Binary Feature Selection
A binary chromosome $\mathbf{c} \in \{0, 1\}^D$ encodes active features across the 9 primary and hemodynamic derived dimensions (`heart_rate`, `spo2`, `systolic_bp`, `diastolic_bp`, `respiratory_rate`, `temperature`, `shock_index`, `pulse_pressure`, `mean_arterial_bp`).

The multi-objective fitness function optimized over successive generations is:
$$\text{Fitness}(\mathbf{c}) = \text{Val\_AUROC}(\mathbf{c}) - 0.28 \cdot \text{Perturbation\_Sensitivity}(\mathbf{c}) - 0.06 \cdot \frac{\sum_{i=1}^D c_i}{D}$$

Where:
- $\text{Val\_AUROC}(\mathbf{c})$: Model discrimination on the validation split.
- $\text{Perturbation\_Sensitivity}(\mathbf{c})$: Mean absolute score change under controlled Gaussian noise injected into the validation split:
  $$\text{MASC} = \frac{1}{N_{\text{val}}} \sum_{i=1}^{N_{\text{val}}} \left| P(x_i) - P(x_i + \epsilon) \right|$$
- $\text{Sparsity Penalty}$: Penalizes redundant or collinear features that increase edge vulnerability.

---

## 5. Quickstart Guide

### Option 1: One-Click Startup (macOS & Linux)
From the repository root, simply execute:
```bash
./start.sh
```
This automatically installs dependencies, initializes the synthetic cohort, trains both models, and starts:
- **Research Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Running Automated Tests

Run the test suite to verify data quality rules, ML leakage prevention, and API contracts:
```bash
export PYTHONPATH="backend"
pytest backend/tests -v
```

Expected result:
```
backend/tests/test_api.py::test_api_health PASSED
backend/tests/test_api.py::test_api_dashboard_summary PASSED
backend/tests/test_api.py::test_api_records_list PASSED
backend/tests/test_api.py::test_api_model_comparison PASSED
backend/tests/test_api.py::test_api_what_if_simulator PASSED
backend/tests/test_api.py::test_api_experiments_and_csv_export PASSED
backend/tests/test_data_quality.py::test_data_quality_clean_record PASSED
backend/tests/test_data_quality.py::test_data_quality_missing_vital PASSED
backend/tests/test_data_quality.py::test_data_quality_implausible_reading PASSED
backend/tests/test_data_quality.py::test_data_quality_pressure_inversion PASSED
backend/tests/test_ml_pipeline.py::test_preprocessor_no_leakage PASSED
backend/tests/test_ml_pipeline.py::test_ml_pipeline_train_and_evaluate PASSED
backend/tests/test_ml_pipeline.py::test_predict_single_vitals PASSED
================== 13 passed in 100% ==================
```

---

## 7. Dataset Schema & CSV Upload Specification

Uploaded datasets must be de-identified and formatted as `.csv`.

| Column | Type | Required | Description | Plausible Range |
| :--- | :--- | :--- | :--- | :--- |
| `record_id` | String | Yes | Anonymized record ID (e.g., `REC-1001`) | Unique |
| `timestamp` | String | Yes | ISO format (`YYYY-MM-DD HH:MM:SS`) | Past telemetry |
| `heart_rate` | Float | Optional | Heart rate in beats per minute | 30.0 – 240.0 bpm |
| `spo2` | Float | Optional | Pulse oximetry saturation percentage | 50.0 – 100.0 % |
| `systolic_bp` | Float | Optional | Systolic arterial pressure | 40.0 – 260.0 mmHg |
| `diastolic_bp` | Float | Optional | Diastolic arterial pressure | 25.0 – 160.0 mmHg |
| `respiratory_rate` | Float | Optional | Breaths per minute | 4.0 – 60.0 bpm |
| `temperature` | Float | Optional | Core body temperature | 32.0 – 43.0 °C |
| `is_critical` | Integer | Yes | Binary critical event indicator | 0 (Stable) or 1 (Critical) |

A template file can be downloaded directly from the UI or via `GET /api/records/sample-csv`.

---

## 8. API Endpoints

- `GET /api/health`: Health status, database state, model status, and disclaimer.
- `GET /api/dashboard/summary`: Cohort summary metrics, vital distributions, and risk histograms.
- `GET /api/records`: Paginated record query with search, status filters, and sorting.
- `GET /api/records/{record_id}`: Single record detail and individual audit warnings.
- `POST /api/records/reset-synthetic`: Regenerates the synthetic cohort and retrains models.
- `POST /api/records/upload-csv`: Validates and ingests authorized de-identified CSV cohorts.
- `GET /api/records/sample-csv`: Downloads template CSV.
- `GET /api/data-quality/report`: Comprehensive cohort data-quality audit report.
- `GET /api/data-quality/rules`: Retrieves active configurable research rules.
- `PUT /api/data-quality/rules`: Modifies rule plausibility bounds and staleness limits.
- `GET /api/models/comparison`: Baseline RF vs GA-selected RF metrics on held-out test data.
- `POST /api/models/retrain`: Retrains models on current database records.
- `POST /api/simulator/what-if`: Executes controlled perturbation simulation and logs to history.
- `GET /api/experiments`: Retrieves past experiment run logs.
- `GET /api/experiments/export-csv`: Exports experiment audit logs to CSV.

---

## 9. Epistemic & Ethical Boundaries

1. **Experimental Prototype**: This software is built for educational demonstration and reliability research. It has not undergone clinical certification and must never be used for triage or bedside decision-making.
2. **Uncalibrated Model Scores**: Model outputs represent tree-split class distributions from Random Forests, not calibrated biological probabilities.
3. **No Causality**: Feature attributions describe statistical partitioning in multidimensional training space and do not establish biological causation.
4. **Synthetic Data**: Default records are procedurally generated using physiological distribution equations. Every synthetic record is explicitly stamped with `SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE`.

---

## 10. Optic Forge Hackathon Jury Checklist

- [x] **Complete, Functional Full-Stack Web App**: Live React/TS/Tailwind frontend communicating with FastAPI/scikit-learn backend.
- [x] **Apple-Inspired Dark Aesthetic**: Deep navy palette (`#070B14`, `#0B1120`), cyan/purple accents, soft glow borders, rounded cards, clean typography.
- [x] **Live Animated Waveform**: Dynamic Lead II telemetry visualizer reflecting real-time noise injection and staleness.
- [x] **WHAT IF Simulator**: Live vital sliders, Gaussian noise, sensor dropout toggles, stale timestamp simulation, and ghost signal classification.
- [x] **Model Comparison**: Baseline RF vs GA-selected RF evaluated on held-out test data with decision threshold tuning and ROC curves.
- [x] **Data Quality Monitor**: Real-time detection of missingness, staleness, and implausibility with configurable research rules.
- [x] **Persistence & CSV Export**: SQLite database storing records and experiment runs with instant CSV export.
- [x] **Offline Mock-Data Mode**: Seamless fallback mode if backend is disconnected, clearly documenting demo mode without pretending mock data is trained.
- [x] **100% Automated Test Suite Passing**: 13/13 tests verifying data quality, ML leakage prevention, and API endpoints.
- [x] **Comprehensive SDG Alignment**: Detailed mapping to SDG 3 and SDG 9, with SDG 10 framed strictly as a future research roadmap.
