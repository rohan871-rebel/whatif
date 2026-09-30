import { DashboardSummary, ModelComparisonResponse, VitalRecord, RuleConfig, DataQualityReport, WhatIfResponse } from '../types';

export const MOCK_RULES: RuleConfig[] = [
  {
    rule_id: 'RULE_HR_PLAUSIBLE',
    field: 'heart_rate',
    name: 'Heart Rate Boundary Check',
    min_plausible: 30.0,
    max_plausible: 240.0,
    severity: 'CRITICAL',
    description: 'Heart rate outside [30, 240] bpm is physiologically incompatible with standard telemetry sensors without severe artifact.',
    enabled: true
  },
  {
    rule_id: 'RULE_SPO2_PLAUSIBLE',
    field: 'spo2',
    name: 'SpO2 Pulse Oximetry Boundary Check',
    min_plausible: 50.0,
    max_plausible: 100.0,
    severity: 'CRITICAL',
    description: 'SpO2 < 50% usually signals photoplethysmogram probe detachment or ambient optical noise rather than true hypoxia.',
    enabled: true
  },
  {
    rule_id: 'RULE_SBP_PLAUSIBLE',
    field: 'systolic_bp',
    name: 'Systolic BP Boundary Check',
    min_plausible: 40.0,
    max_plausible: 260.0,
    severity: 'CRITICAL',
    description: 'Systolic blood pressure outside [40, 260] mmHg indicates cuff deflation slippage or severe transducer damping.',
    enabled: true
  },
  {
    rule_id: 'RULE_TIMESTAMP_STALENESS',
    field: 'timestamp',
    name: 'Telemetry Staleness Audit',
    max_stale_minutes: 120,
    severity: 'WARNING',
    description: 'Readings older than 120 minutes represent stale telemetry buffers that should not drive acute risk estimation.',
    enabled: true
  }
];

export const MOCK_RECORDS: VitalRecord[] = [
  {
    record_id: 'SYN-REC-1001',
    timestamp: '2026-09-30 09:42:00',
    heart_rate: 74.5,
    spo2: 98.2,
    systolic_bp: 118.0,
    diastolic_bp: 76.0,
    respiratory_rate: 15.0,
    temperature: 36.8,
    is_critical: 0,
    is_synthetic: true,
    synthetic_label: 'SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE',
    baseline_risk: 0.12,
    ga_risk: 0.10,
    quality_status: 'CLEAN'
  },
  {
    record_id: 'SYN-REC-1002',
    timestamp: '2026-09-30 08:15:00',
    heart_rate: 128.0,
    spo2: 88.5,
    systolic_bp: 82.0,
    diastolic_bp: 50.0,
    respiratory_rate: 32.0,
    temperature: 39.2,
    is_critical: 1,
    is_synthetic: true,
    synthetic_label: 'SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE',
    baseline_risk: 0.89,
    ga_risk: 0.85,
    quality_status: 'CLEAN'
  },
  {
    record_id: 'SYN-REC-1003',
    timestamp: '2026-09-30 04:10:00',
    heart_rate: 82.0,
    spo2: null,
    systolic_bp: 122.0,
    diastolic_bp: 80.0,
    respiratory_rate: 16.0,
    temperature: 37.0,
    is_critical: 0,
    is_synthetic: true,
    synthetic_label: 'SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE',
    baseline_risk: 0.35,
    ga_risk: 0.28,
    quality_status: 'WARNING',
    quality_warnings: ["Missing vital reading for 'spo2'. Downstream model must rely on imputation."]
  },
  {
    record_id: 'SYN-REC-1004',
    timestamp: '2026-09-30 09:55:00',
    heart_rate: 248.0,
    spo2: 44.0,
    systolic_bp: 125.0,
    diastolic_bp: 82.0,
    respiratory_rate: 18.0,
    temperature: 36.9,
    is_critical: 0,
    is_synthetic: true,
    synthetic_label: 'SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE',
    baseline_risk: 0.62,
    ga_risk: 0.24,
    quality_status: 'DEFECT',
    quality_warnings: [
      'Heart Rate Boundary Check violation: value 248.0 exceeds research maximum (240.0). High probability of transient sensor noise spike.',
      'SpO2 Pulse Oximetry Boundary Check violation: value 44.0 is below research minimum (50.0). Possible sensor artifact or detachment.'
    ]
  },
  {
    record_id: 'SYN-REC-1005',
    timestamp: '2026-09-30 09:30:00',
    heart_rate: 112.0,
    spo2: 91.0,
    systolic_bp: 92.0,
    diastolic_bp: 58.0,
    respiratory_rate: 28.0,
    temperature: 38.6,
    is_critical: 1,
    is_synthetic: true,
    synthetic_label: 'SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE',
    baseline_risk: 0.78,
    ga_risk: 0.81,
    quality_status: 'CLEAN'
  }
];

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  total_records: 600,
  critical_records: 150,
  clean_records: 495,
  warning_records: 68,
  defect_records: 37,
  baseline_auroc: 0.942,
  ga_auroc: 0.938,
  mean_robustness_delta: 24.6,
  latest_experiments: [],
  vitals_distributions: {
    heart_rate: [
      { bin: '40-60 bpm', count: 42, low: 40, high: 60 },
      { bin: '60-80 bpm', count: 285, low: 60, high: 80 },
      { bin: '80-100 bpm', count: 142, low: 80, high: 100 },
      { bin: '100-120 bpm', count: 78, low: 100, high: 120 },
      { bin: '120-140 bpm', count: 41, low: 120, high: 140 },
      { bin: '140-160 bpm', count: 12, low: 140, high: 160 }
    ],
    spo2: [
      { bin: '70-80 %', count: 18, low: 70, high: 80 },
      { bin: '80-90 %', count: 64, low: 80, high: 90 },
      { bin: '90-95 %', count: 96, low: 90, high: 95 },
      { bin: '95-100 %', count: 422, low: 95, high: 100 }
    ],
    systolic_bp: [
      { bin: '60-90 mmHg', count: 68, low: 60, high: 90 },
      { bin: '90-120 mmHg', count: 260, low: 90, high: 120 },
      { bin: '120-150 mmHg', count: 210, low: 120, high: 150 },
      { bin: '150-180 mmHg', count: 44, low: 150, high: 180 },
      { bin: '180-220 mmHg', count: 18, low: 180, high: 220 }
    ]
  },
  risk_distributions: {
    baseline_risk: [
      { range: '0.00-0.20', count: 320, tier: 'Non-Critical' },
      { range: '0.20-0.40', count: 110, tier: 'Non-Critical' },
      { range: '0.40-0.60', count: 45, tier: 'Critical Risk' },
      { range: '0.60-0.80', count: 52, tier: 'Critical Risk' },
      { range: '0.80-1.00', count: 73, tier: 'Critical Risk' }
    ],
    ga_risk: [
      { range: '0.00-0.20', count: 345, tier: 'Non-Critical' },
      { range: '0.20-0.40', count: 95, tier: 'Non-Critical' },
      { range: '0.40-0.60', count: 38, tier: 'Critical Risk' },
      { range: '0.60-0.80', count: 48, tier: 'Critical Risk' },
      { range: '0.80-1.00', count: 74, tier: 'Critical Risk' }
    ]
  },
  is_synthetic: true,
  synthetic_label: 'SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE',
  disclaimer: 'Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions.'
};

export const MOCK_MODEL_COMPARISON: ModelComparisonResponse = {
  baseline_model: {
    model_name: 'Baseline Random Forest',
    model_version: 'v1.0-Baseline-AllFeatures',
    auroc: 0.942,
    recall_sensitivity: 0.884,
    false_negative_rate: 0.116,
    false_negative_count: 7,
    critical_cases_count: 60,
    mean_absolute_score_change: 0.184,
    selected_features_count: 9,
    selected_feature_names: ['heart_rate', 'spo2', 'systolic_bp', 'diastolic_bp', 'respiratory_rate', 'temperature', 'shock_index', 'pulse_pressure', 'mean_arterial_bp'],
    all_feature_names: ['heart_rate', 'spo2', 'systolic_bp', 'diastolic_bp', 'respiratory_rate', 'temperature', 'shock_index', 'pulse_pressure', 'mean_arterial_bp'],
    feature_mask: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    decision_threshold: 0.50,
    evaluation_split: 'Untouched held-out test split (20% of cohort, stratified)',
    confusion_matrix: { tp: 53, fp: 6, tn: 54, fn: 7 },
    roc_curve: [
      { fpr: 0.0, tpr: 0.0 }, { fpr: 0.02, tpr: 0.52 }, { fpr: 0.05, tpr: 0.78 },
      { fpr: 0.10, tpr: 0.88 }, { fpr: 0.20, tpr: 0.94 }, { fpr: 0.40, tpr: 0.98 }, { fpr: 1.0, tpr: 1.0 }
    ],
    disclaimer: 'Evaluated on held-out test records using reproducible seed 42.'
  },
  ga_model: {
    model_name: 'Genetic Algorithm RF',
    model_version: 'v1.0-GA-Robust',
    auroc: 0.938,
    recall_sensitivity: 0.900,
    false_negative_rate: 0.100,
    false_negative_count: 6,
    critical_cases_count: 60,
    mean_absolute_score_change: 0.138,
    selected_features_count: 5,
    selected_feature_names: ['heart_rate', 'spo2', 'systolic_bp', 'respiratory_rate', 'shock_index'],
    all_feature_names: ['heart_rate', 'spo2', 'systolic_bp', 'diastolic_bp', 'respiratory_rate', 'temperature', 'shock_index', 'pulse_pressure', 'mean_arterial_bp'],
    feature_mask: [1, 1, 1, 0, 1, 0, 1, 0, 0],
    decision_threshold: 0.50,
    evaluation_split: 'Untouched held-out test split (20% of cohort, stratified)',
    confusion_matrix: { tp: 54, fp: 5, tn: 55, fn: 6 },
    roc_curve: [
      { fpr: 0.0, tpr: 0.0 }, { fpr: 0.02, tpr: 0.55 }, { fpr: 0.04, tpr: 0.80 },
      { fpr: 0.08, tpr: 0.90 }, { fpr: 0.18, tpr: 0.95 }, { fpr: 0.35, tpr: 0.98 }, { fpr: 1.0, tpr: 1.0 }
    ],
    disclaimer: 'Evaluated on held-out test records using reproducible seed 42.'
  },
  robustness_gain_percent: 25.0,
  decision_threshold: 0.50,
  dataset_summary: {
    test_samples: 120,
    critical_test_samples: 60,
    non_critical_test_samples: 60
  }
};
