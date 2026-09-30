import {
  DashboardSummary,
  ModelComparisonResponse,
  RobustnessCurveResponse,
  VitalRecord,
  RuleConfig,
  DataQualityReport,
  WhatIfRequest,
  WhatIfResponse,
  ExperimentRecord
} from './types';
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_MODEL_COMPARISON,
  MOCK_RECORDS,
  MOCK_RULES
} from './utils/mockData';

const BASE_URL = '/api';

export let isBackendConnected = false;

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      isBackendConnected = data.status === 'healthy';
      return isBackendConnected;
    }
  } catch {
    isBackendConnected = false;
  }
  return false;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${BASE_URL}/dashboard/summary`);
    if (res.ok) {
      isBackendConnected = true;
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, using mock dashboard data', err);
    isBackendConnected = false;
  }
  return MOCK_DASHBOARD_SUMMARY;
}

export async function fetchRecords(params: {
  search?: string;
  quality_status?: string;
  is_critical?: number;
  sort_by?: string;
  order?: string;
  limit?: number;
  offset?: number;
}): Promise<{ records: VitalRecord[]; total: number }> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.quality_status) query.append('quality_status', params.quality_status);
    if (params.is_critical !== undefined) query.append('is_critical', String(params.is_critical));
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.order) query.append('order', params.order);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    const res = await fetch(`${BASE_URL}/records?${query.toString()}`);
    if (res.ok) {
      isBackendConnected = true;
      const data = await res.json();
      return { records: data.records, total: data.total };
    }
  } catch (err) {
    console.warn('Backend unavailable, using mock records', err);
    isBackendConnected = false;
  }
  return { records: MOCK_RECORDS, total: MOCK_RECORDS.length };
}

export async function fetchRecordDetail(recordId: string): Promise<VitalRecord> {
  try {
    const res = await fetch(`${BASE_URL}/records/${recordId}`);
    if (res.ok) {
      isBackendConnected = true;
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, fallback for record detail', err);
    isBackendConnected = false;
  }
  const found = MOCK_RECORDS.find(r => r.record_id === recordId);
  if (found) return found;
  return MOCK_RECORDS[0];
}

export async function resetSyntheticCohort(nSamples = 600): Promise<void> {
  const res = await fetch(`${BASE_URL}/records/reset-synthetic?n_samples=${nSamples}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Reset failed' }));
    throw new Error(err.detail || 'Failed to reset cohort');
  }
}

export async function uploadDatasetCsv(file: File): Promise<{ message: string; total_records: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/records/upload-csv`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Failed to upload CSV');
  }
  return await res.json();
}

export async function fetchDataQualityReport(): Promise<DataQualityReport> {
  try {
    const res = await fetch(`${BASE_URL}/data-quality/report`);
    if (res.ok) {
      isBackendConnected = true;
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, using mock quality report', err);
    isBackendConnected = false;
  }
  return {
    total_checked: MOCK_RECORDS.length,
    clean_count: 3,
    warning_count: 1,
    defect_count: 1,
    disclaimer: 'Thresholds are configurable research rules, not universal clinical standards.',
    warnings: [
      {
        record_id: 'SYN-REC-1003',
        field: 'spo2',
        rule_id: 'RULE_MISSING_VALUE',
        severity: 'WARNING',
        message: "Missing vital reading for 'spo2'. Downstream model must rely on imputation.",
        timestamp: '2026-09-30 04:10:00'
      },
      {
        record_id: 'SYN-REC-1004',
        field: 'heart_rate',
        rule_id: 'RULE_HR_PLAUSIBLE',
        severity: 'CRITICAL',
        message: 'Heart Rate Boundary Check violation: value 248.0 exceeds research maximum (240.0). High probability of transient sensor noise spike.',
        current_value: 248.0,
        timestamp: '2026-09-30 09:55:00'
      }
    ],
    rule_configs: MOCK_RULES
  };
}

export async function updateRuleConfig(rule: RuleConfig): Promise<RuleConfig[]> {
  const res = await fetch(`${BASE_URL}/data-quality/rules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  if (!res.ok) {
    throw new Error('Failed to update rule');
  }
  return await res.json();
}

export async function fetchModelComparison(threshold = 0.50): Promise<ModelComparisonResponse> {
  try {
    const res = await fetch(`${BASE_URL}/models/comparison?threshold=${threshold}`);
    if (res.ok) {
      isBackendConnected = true;
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, using mock model comparison', err);
    isBackendConnected = false;
  }
  return MOCK_MODEL_COMPARISON;
}

export async function runWhatIfSimulation(req: WhatIfRequest): Promise<WhatIfResponse> {
  const res = await fetch(`${BASE_URL}/simulator/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Simulation request failed' }));
    throw new Error(err.detail || 'Simulation error');
  }
  return await res.json();
}

export async function fetchExperiments(): Promise<ExperimentRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/experiments?limit=50`);
    if (res.ok) {
      isBackendConnected = true;
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, empty experiment history', err);
    isBackendConnected = false;
  }
  return [];
}

export async function fetchRobustnessCurve(): Promise<RobustnessCurveResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/models/robustness-curve`);
    if (res.ok) {
      isBackendConnected = true;
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable for robustness curve', err);
    isBackendConnected = false;
  }
  return null;
}
