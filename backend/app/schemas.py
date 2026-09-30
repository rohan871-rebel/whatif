"""
Pydantic schemas for GHOST SIGNAL — WHAT IF?
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class VitalRecordBase(BaseModel):
    record_id: str
    timestamp: str
    heart_rate: Optional[float] = Field(None, description="Heart rate in bpm")
    spo2: Optional[float] = Field(None, description="Oxygen saturation in % (SpO2)")
    oxygen_saturation: Optional[float] = Field(None, description="Oxygen saturation in % (clinical semantic equivalent to SpO2)")
    systolic_bp: Optional[float] = Field(None, description="Systolic blood pressure in mmHg")
    diastolic_bp: Optional[float] = Field(None, description="Diastolic blood pressure in mmHg")
    respiratory_rate: Optional[float] = Field(None, description="Respiratory rate in bpm")
    temperature: Optional[float] = Field(None, description="Core body temperature in Celsius")
    is_critical: int = Field(0, description="1 if critical event, 0 if non-critical")

    @model_validator(mode="before")
    @classmethod
    def sync_oxygen_saturation(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if data.get("oxygen_saturation") is not None and data.get("spo2") is None:
                data["spo2"] = data["oxygen_saturation"]
            elif data.get("spo2") is not None and data.get("oxygen_saturation") is None:
                data["oxygen_saturation"] = data["spo2"]
        return data


class VitalRecord(VitalRecordBase):
    is_synthetic: bool = True
    synthetic_label: str = "SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE"
    baseline_risk: Optional[float] = None
    ga_risk: Optional[float] = None
    quality_status: str = "CLEAN"  # CLEAN, WARNING, DEFECT
    quality_warnings: List[str] = []


class RuleConfig(BaseModel):
    rule_id: str
    field: str
    name: str
    min_plausible: Optional[float] = None
    max_plausible: Optional[float] = None
    max_stale_minutes: Optional[int] = None
    severity: str = "WARNING"  # WARNING, CRITICAL
    description: str
    enabled: bool = True


class DataQualityWarning(BaseModel):
    record_id: str
    field: str
    rule_id: str
    severity: str
    message: str
    current_value: Optional[Any] = None
    timestamp: str


class DataQualityReport(BaseModel):
    total_checked: int
    clean_count: int
    warning_count: int
    defect_count: int
    disclaimer: str = "Thresholds are configurable research rules, not universal clinical standards."
    warnings: List[DataQualityWarning]
    rule_configs: List[RuleConfig]


class WhatIfRequest(BaseModel):
    record_id: str
    vitals: Dict[str, Optional[float]]
    noise_std: float = Field(0.0, ge=0.0, le=1.0, description="Noise magnitude standard deviation fraction (0.0 to 1.0)")
    dropped_fields: List[str] = Field(default_factory=list, description="Fields to simulate sensor dropout/missingness")
    timestamp_stale_minutes: int = Field(0, ge=0, description="Simulate stale timestamp delay in minutes")
    custom_notes: Optional[str] = None


class WhatIfResponse(BaseModel):
    record_id: str
    original_vitals: Dict[str, Optional[float]]
    perturbed_vitals: Dict[str, Optional[float]]
    baseline_risk_original: float
    baseline_risk_perturbed: float
    ga_risk_original: float
    ga_risk_perturbed: float
    delta_baseline: float
    delta_ga: float
    prediction_change_magnitude: float = Field(0.0, description="Absolute risk score shift |baseline_risk_perturbed - baseline_risk_original|")
    is_false_negative: bool = Field(False, description="True if perturbation induced a Silent Failure (critical risk masked below decision threshold)")
    is_false_positive: bool = Field(False, description="True if perturbation induced a Spurious Alarm (stable patient flagged critical)")
    false_negative_risk_delta: Optional[float] = Field(None, description="Quantified risk suppression delta if false negative occurs")
    ghost_signal_detected: bool
    ghost_signal_type: Optional[str] = None  # None, "SPURIOUS_ALARM" (false positive), "SILENT_FAILURE" (false negative)
    ghost_signal_severity: str  # NONE, LOW, MEDIUM, HIGH
    affected_features: List[str]
    plain_language_explanation: str
    disclaimer: str = (
        "Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions. "
        "Simulated outputs illustrate mathematical sensitivity; they do not predict actual biological trajectories."
    )


class ModelMetrics(BaseModel):
    model_name: str
    model_version: str
    auroc: float
    recall_sensitivity: float
    false_negative_rate: float
    false_negative_count: int
    critical_cases_count: int
    mean_absolute_score_change: float  # Perturbation vulnerability index
    selected_features_count: int
    selected_feature_names: List[str]
    all_feature_names: List[str]
    feature_mask: List[int]  # 1 = included, 0 = excluded
    decision_threshold: float = 0.50
    evaluation_split: str = "Untouched held-out test split (20% of cohort, stratified)"
    confusion_matrix: Dict[str, int]  # tp, fp, tn, fn
    roc_curve: List[Dict[str, float]]  # fpr, tpr points
    disclaimer: str = (
        "Evaluated on held-out test records using reproducible seed 42. "
        "Performance reflects synthetic benchmark distributions and does not establish clinical efficacy."
    )


class ModelComparisonResponse(BaseModel):
    baseline_model: ModelMetrics
    ga_model: ModelMetrics
    robustness_gain_percent: float
    decision_threshold: float
    dataset_summary: Dict[str, int]


class ExperimentRecord(BaseModel):
    experiment_id: str
    timestamp: str
    record_id: str
    perturbation_type: str
    noise_std: float
    dropped_fields: List[str]
    stale_minutes: int
    baseline_before: float
    baseline_after: float
    ga_before: float
    ga_after: float
    delta_baseline: float
    delta_ga: float
    ghost_signal_type: Optional[str] = None
    notes: Optional[str] = None


class DashboardSummary(BaseModel):
    total_records: int
    critical_records: int
    clean_records: int
    warning_records: int
    defect_records: int
    baseline_auroc: float
    ga_auroc: float
    mean_robustness_delta: float
    latest_experiments: List[ExperimentRecord]
    vitals_distributions: Dict[str, List[Dict[str, Any]]]
    risk_distributions: Dict[str, List[Dict[str, Any]]]
    is_synthetic: bool = True
    synthetic_label: str = "SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE"
    disclaimer: str = (
        "Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions."
    )


class HealthResponse(BaseModel):
    status: str
    version: str
    database_connected: bool
    models_trained: bool
    synthetic_mode: bool
    disclaimer: str
