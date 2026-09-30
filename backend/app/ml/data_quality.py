"""
Data Quality Auditing and Anomaly Detection Engine.
Enforces configurable research rules (not universal clinical standards).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import pandas as pd
import numpy as np

from app.schemas import RuleConfig, DataQualityWarning, DataQualityReport


DEFAULT_RESEARCH_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "RULE_HR_PLAUSIBLE",
        "field": "heart_rate",
        "name": "Heart Rate Boundary Check",
        "min_plausible": 30.0,
        "max_plausible": 240.0,
        "severity": "CRITICAL",
        "description": "Heart rate outside [30, 240] bpm is physiologically incompatible with standard telemetry sensors without severe artifact.",
        "enabled": True
    },
    {
        "rule_id": "RULE_SPO2_PLAUSIBLE",
        "field": "spo2",
        "name": "SpO2 Pulse Oximetry Boundary Check",
        "min_plausible": 50.0,
        "max_plausible": 100.0,
        "severity": "CRITICAL",
        "description": "SpO2 < 50% usually signals photoplethysmogram probe detachment or ambient optical noise rather than true hypoxia.",
        "enabled": True
    },
    {
        "rule_id": "RULE_SBP_PLAUSIBLE",
        "field": "systolic_bp",
        "name": "Systolic BP Boundary Check",
        "min_plausible": 40.0,
        "max_plausible": 260.0,
        "severity": "CRITICAL",
        "description": "Systolic blood pressure outside [40, 260] mmHg indicates cuff deflation slippage or severe transducer damping.",
        "enabled": True
    },
    {
        "rule_id": "RULE_DBP_PLAUSIBLE",
        "field": "diastolic_bp",
        "name": "Diastolic BP Boundary Check",
        "min_plausible": 25.0,
        "max_plausible": 160.0,
        "severity": "WARNING",
        "description": "Diastolic BP outside [25, 160] mmHg indicates transducer artifact or cuff misplacement.",
        "enabled": True
    },
    {
        "rule_id": "RULE_RR_PLAUSIBLE",
        "field": "respiratory_rate",
        "name": "Respiratory Rate Boundary Check",
        "min_plausible": 4.0,
        "max_plausible": 60.0,
        "severity": "WARNING",
        "description": "Respiratory rate outside [4, 60] bpm indicates impedance pneumography lead displacement or patient movement.",
        "enabled": True
    },
    {
        "rule_id": "RULE_TEMP_PLAUSIBLE",
        "field": "temperature",
        "name": "Core Temperature Boundary Check",
        "min_plausible": 32.0,
        "max_plausible": 43.0,
        "severity": "CRITICAL",
        "description": "Temperature outside [32.0, 43.0] °C indicates probe exposure to ambient cold or probe detachment.",
        "enabled": True
    },
    {
        "rule_id": "RULE_TIMESTAMP_STALENESS",
        "field": "timestamp",
        "name": "Telemetry Staleness Audit",
        "max_stale_minutes": 120,
        "severity": "WARNING",
        "description": "Readings older than 120 minutes represent stale telemetry buffers that should not drive acute risk estimation.",
        "enabled": True
    }
]


class DataQualityMonitor:
    def __init__(self, rules: Optional[List[Dict[str, Any]]] = None):
        self.rules = [RuleConfig(**r) for r in (rules or DEFAULT_RESEARCH_RULES)]

    def get_rule_configs(self) -> List[RuleConfig]:
        return self.rules

    def update_rule(self, updated_rule: RuleConfig):
        for idx, rule in enumerate(self.rules):
            if rule.rule_id == updated_rule.rule_id:
                self.rules[idx] = updated_rule
                return True
        return False

    def audit_record(
        self,
        record: Dict[str, Any],
        reference_time: Optional[datetime] = None
    ) -> List[DataQualityWarning]:
        """Audits a single record dictionary against active quality rules."""
        warnings: List[DataQualityWarning] = []
        rec_id = str(record.get("record_id", "UNKNOWN"))
        ref_time = reference_time or datetime.now(timezone.utc)

        # 1. Missingness checks
        vital_fields = ["heart_rate", "spo2", "systolic_bp", "diastolic_bp", "respiratory_rate", "temperature"]
        for field in vital_fields:
            val = record.get(field)
            if val is None or (isinstance(val, float) and np.isnan(val)):
                warnings.append(DataQualityWarning(
                    record_id=rec_id,
                    field=field,
                    rule_id="RULE_MISSING_VALUE",
                    severity="WARNING",
                    message=f"Missing vital reading for '{field}'. Downstream model must rely on imputation.",
                    current_value=None,
                    timestamp=str(record.get("timestamp", ""))
                ))

        # 2. Check physiological plausibility rules
        for rule in self.rules:
            if not rule.enabled:
                continue

            field = rule.field
            val = record.get(field)

            # Plausibility range checks
            if field in vital_fields and val is not None and not (isinstance(val, float) and np.isnan(val)):
                try:
                    num_val = float(val)
                    if rule.min_plausible is not None and num_val < rule.min_plausible:
                        warnings.append(DataQualityWarning(
                            record_id=rec_id,
                            field=field,
                            rule_id=rule.rule_id,
                            severity=rule.severity,
                            message=f"{rule.name} violation: value {num_val} is below research minimum ({rule.min_plausible}). Possible sensor artifact or detachment.",
                            current_value=num_val,
                            timestamp=str(record.get("timestamp", ""))
                        ))
                    elif rule.max_plausible is not None and num_val > rule.max_plausible:
                        warnings.append(DataQualityWarning(
                            record_id=rec_id,
                            field=field,
                            rule_id=rule.rule_id,
                            severity=rule.severity,
                            message=f"{rule.name} violation: value {num_val} exceeds research maximum ({rule.max_plausible}). High probability of transient sensor noise spike.",
                            current_value=num_val,
                            timestamp=str(record.get("timestamp", ""))
                        ))
                except (ValueError, TypeError):
                    pass

            # Timestamp staleness check
            if field == "timestamp" and rule.max_stale_minutes is not None:
                ts_str = record.get("timestamp")
                if ts_str:
                    try:
                        # Parse ISO format or standard space format
                        clean_ts_str = str(ts_str).replace("T", " ")
                        parsed_ts = datetime.strptime(clean_ts_str[:19], "%Y-%m-%d %H:%M:%S")
                        age_minutes = (ref_time - parsed_ts).total_seconds() / 60.0
                        if age_minutes > rule.max_stale_minutes:
                            warnings.append(DataQualityWarning(
                                record_id=rec_id,
                                field="timestamp",
                                rule_id=rule.rule_id,
                                severity=rule.severity,
                                message=f"Stale telemetry: record age is {int(age_minutes)} minutes (threshold: {rule.max_stale_minutes} min). Risk scores computed on stale vitals may be invalid.",
                                current_value=f"{int(age_minutes)} min ago",
                                timestamp=str(ts_str)
                            ))
                    except Exception:
                        pass

        # 3. Relational check: DBP >= SBP
        sbp = record.get("systolic_bp")
        dbp = record.get("diastolic_bp")
        if sbp is not None and dbp is not None:
            try:
                if float(dbp) >= float(sbp):
                    warnings.append(DataQualityWarning(
                        record_id=rec_id,
                        field="blood_pressure",
                        rule_id="RULE_PRESSURE_INVERSION",
                        severity="CRITICAL",
                        message=f"Physiological inversion: Diastolic BP ({dbp} mmHg) >= Systolic BP ({sbp} mmHg). Manometer transducer error.",
                        current_value=f"SBP {sbp} / DBP {dbp}",
                        timestamp=str(record.get("timestamp", ""))
                    ))
            except Exception:
                pass

        return warnings

    def audit_cohort(self, df: pd.DataFrame) -> DataQualityReport:
        """Audits an entire cohort DataFrame and generates a structured summary."""
        all_warnings: List[DataQualityWarning] = []
        clean_count = 0
        warning_count = 0
        defect_count = 0

        # Use recent max timestamp as reference point to avoid false staleness in static datasets
        ref_time = datetime.now(timezone.utc)
        if "timestamp" in df.columns:
            try:
                valid_ts = pd.to_datetime(df["timestamp"], errors="coerce").dropna()
                if not valid_ts.empty:
                    ref_time = valid_ts.max().to_pydatetime()
            except Exception:
                pass

        records = df.to_dict(orient="records")
        for rec in records:
            rec_warnings = self.audit_record(rec, reference_time=ref_time)
            all_warnings.extend(rec_warnings)
            if not rec_warnings:
                clean_count += 1
            else:
                has_critical = any(w.severity == "CRITICAL" for w in rec_warnings)
                if has_critical:
                    defect_count += 1
                else:
                    warning_count += 1

        return DataQualityReport(
            total_checked=len(records),
            clean_count=clean_count,
            warning_count=warning_count,
            defect_count=defect_count,
            disclaimer="Thresholds are configurable research rules, not universal clinical standards.",
            warnings=all_warnings[:100],  # Return up to 100 most relevant warnings
            rule_configs=self.rules
        )
