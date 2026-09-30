export interface VitalRecord {
  record_id: string;
  timestamp: string;
  heart_rate: number | null;
  spo2: number | null;
  oxygen_saturation?: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  is_critical: number;
  is_synthetic: boolean;
  synthetic_label: string;
  baseline_risk?: number | null;
  ga_risk?: number | null;
  quality_status: 'CLEAN' | 'WARNING' | 'DEFECT';
  quality_warnings?: string[];
}

export interface RuleConfig {
  rule_id: string;
  field: string;
  name: string;
  min_plausible?: number | null;
  max_plausible?: number | null;
  max_stale_minutes?: number | null;
  severity: 'WARNING' | 'CRITICAL';
  description: string;
  enabled: boolean;
}

export interface DataQualityWarning {
  record_id: string;
  field: string;
  rule_id: string;
  severity: string;
  message: string;
  current_value?: any;
  timestamp: string;
}

export interface DataQualityReport {
  total_checked: number;
  clean_count: number;
  warning_count: number;
  defect_count: number;
  disclaimer: string;
  warnings: DataQualityWarning[];
  rule_configs: RuleConfig[];
}

export interface WhatIfRequest {
  record_id: string;
  vitals: {
    heart_rate?: number | null;
    spo2?: number | null;
    systolic_bp?: number | null;
    diastolic_bp?: number | null;
    respiratory_rate?: number | null;
    temperature?: number | null;
    [key: string]: any;
  };
  noise_std: number;
  dropped_fields: string[];
  timestamp_stale_minutes: number;
  custom_notes?: string;
}

export interface WhatIfResponse {
  record_id: string;
  original_vitals: Record<string, number | null>;
  perturbed_vitals: Record<string, number | null>;
  baseline_risk_original: number;
  baseline_risk_perturbed: number;
  ga_risk_original: number;
  ga_risk_perturbed: number;
  delta_baseline: number;
  delta_ga: number;
  prediction_change_magnitude?: number;
  is_false_negative?: boolean;
  is_false_positive?: boolean;
  false_negative_risk_delta?: number | null;
  ghost_signal_detected: boolean;
  ghost_signal_type: 'SILENT_FAILURE' | 'SPURIOUS_ALARM' | 'VOLATILITY_DRIFT' | null;
  ghost_signal_severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  affected_features: string[];
  plain_language_explanation: string;
  disclaimer: string;
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  auroc: number;
  recall_sensitivity: number;
  false_negative_rate: number;
  false_negative_count: number;
  critical_cases_count: number;
  mean_absolute_score_change: number;
  selected_features_count: number;
  selected_feature_names: string[];
  all_feature_names: string[];
  feature_mask: number[];
  decision_threshold: number;
  evaluation_split: string;
  confusion_matrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
  disclaimer: string;
}

export interface ModelComparisonResponse {
  baseline_model: ModelMetrics;
  ga_model: ModelMetrics;
  robustness_gain_percent: number;
  decision_threshold: number;
  dataset_summary: {
    test_samples: number;
    critical_test_samples: number;
    non_critical_test_samples: number;
  };
}

export interface ExperimentRecord {
  experiment_id: string;
  timestamp: string;
  record_id: string;
  perturbation_type: string;
  noise_std: number;
  dropped_fields: string[];
  stale_minutes: number;
  baseline_before: number;
  baseline_after: number;
  ga_before: number;
  ga_after: number;
  delta_baseline: number;
  delta_ga: number;
  ghost_signal_type?: string | null;
  notes?: string | null;
}

export interface DashboardSummary {
  total_records: number;
  critical_records: number;
  clean_records: number;
  warning_records: number;
  defect_records: number;
  baseline_auroc: number;
  ga_auroc: number;
  mean_robustness_delta: number;
  latest_experiments: ExperimentRecord[];
  vitals_distributions: Record<string, Array<{ bin: string; count: number; low: number; high: number }>>;
  risk_distributions: Record<string, Array<{ range: string; count: number; tier: string }>>;
  is_synthetic: boolean;
  synthetic_label: string;
  disclaimer: string;
}
