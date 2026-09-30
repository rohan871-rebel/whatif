"""
Data Quality Auditing and Configurable Rules API Routes.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.schemas import DataQualityReport, RuleConfig

router = APIRouter(prefix="/api/data-quality", tags=["Data Quality"])


def create_data_quality_router(app_state) -> APIRouter:

    @router.get("/report", response_model=DataQualityReport)
    def get_data_quality_report():
        df = app_state.db.get_records_df()
        if df.empty:
            return DataQualityReport(
                total_checked=0,
                clean_count=0,
                warning_count=0,
                defect_count=0,
                warnings=[],
                rule_configs=app_state.data_quality_monitor.get_rule_configs()
            )
        report = app_state.data_quality_monitor.audit_cohort(df)
        return report

    @router.get("/rules", response_model=List[RuleConfig])
    def get_rules():
        return app_state.data_quality_monitor.get_rule_configs()

    @router.put("/rules", response_model=List[RuleConfig])
    def update_rule(rule: RuleConfig):
        success = app_state.data_quality_monitor.update_rule(rule)
        if not success:
            raise HTTPException(status_code=404, detail=f"Rule {rule.rule_id} not found.")
        # Re-audit and sync status
        app_state.sync_predictions_and_quality()
        return app_state.data_quality_monitor.get_rule_configs()

    return router
