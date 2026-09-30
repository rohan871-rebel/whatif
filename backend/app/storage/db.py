"""
SQLite Database Layer for GHOST SIGNAL — WHAT IF?
Manages records, synthetic cohorts, and persistent experiment logs.
"""

import sqlite3
import json
import io
import csv
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import pandas as pd

from app.config import DB_PATH, SYNTHETIC_DATA_LABEL


class Database:
    def __init__(self, db_path=DB_PATH):
        self.db_path = str(db_path)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Vital records table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS vital_records (
                record_id TEXT PRIMARY KEY,
                timestamp TEXT,
                heart_rate REAL,
                spo2 REAL,
                systolic_bp REAL,
                diastolic_bp REAL,
                respiratory_rate REAL,
                temperature REAL,
                is_critical INTEGER DEFAULT 0,
                is_synthetic INTEGER DEFAULT 1,
                synthetic_label TEXT,
                baseline_risk REAL,
                ga_risk REAL,
                quality_status TEXT DEFAULT 'CLEAN'
            )
            """)

            # Experiments table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS experiments (
                experiment_id TEXT PRIMARY KEY,
                timestamp TEXT,
                record_id TEXT,
                perturbation_type TEXT,
                noise_std REAL,
                dropped_fields TEXT,
                stale_minutes INTEGER,
                baseline_before REAL,
                baseline_after REAL,
                ga_before REAL,
                ga_after REAL,
                delta_baseline REAL,
                delta_ga REAL,
                ghost_signal_type TEXT,
                notes TEXT
            )
            """)
            conn.commit()

    def replace_records(self, df: pd.DataFrame):
        """Overwrites vital_records table with new cohort DataFrame."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM vital_records")
            
            records = df.to_dict(orient="records")
            for r in records:
                cursor.execute("""
                INSERT INTO vital_records (
                    record_id, timestamp, heart_rate, spo2, systolic_bp, diastolic_bp,
                    respiratory_rate, temperature, is_critical, is_synthetic,
                    synthetic_label, baseline_risk, ga_risk, quality_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(r.get("record_id")),
                    str(r.get("timestamp")),
                    r.get("heart_rate") if pd.notna(r.get("heart_rate")) else None,
                    r.get("spo2") if pd.notna(r.get("spo2")) else None,
                    r.get("systolic_bp") if pd.notna(r.get("systolic_bp")) else None,
                    r.get("diastolic_bp") if pd.notna(r.get("diastolic_bp")) else None,
                    r.get("respiratory_rate") if pd.notna(r.get("respiratory_rate")) else None,
                    r.get("temperature") if pd.notna(r.get("temperature")) else None,
                    int(r.get("is_critical", 0)),
                    1 if r.get("is_synthetic", True) else 0,
                    r.get("synthetic_label", SYNTHETIC_DATA_LABEL),
                    r.get("baseline_risk") if pd.notna(r.get("baseline_risk")) else None,
                    r.get("ga_risk") if pd.notna(r.get("ga_risk")) else None,
                    r.get("quality_status", "CLEAN")
                ))
            conn.commit()

    def get_records_df(self) -> pd.DataFrame:
        """Loads all records as a Pandas DataFrame."""
        with self._get_connection() as conn:
            df = pd.read_sql_query("SELECT * FROM vital_records", conn)
            return df

    def get_records(
        self,
        search: Optional[str] = None,
        quality_status: Optional[str] = None,
        is_critical: Optional[int] = None,
        sort_by: str = "record_id",
        order: str = "ASC",
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Queries records with filtering, searching, and pagination."""
        valid_cols = {
            "record_id", "timestamp", "heart_rate", "spo2", "systolic_bp",
            "diastolic_bp", "respiratory_rate", "temperature", "is_critical",
            "baseline_risk", "ga_risk", "quality_status"
        }
        col = sort_by if sort_by in valid_cols else "record_id"
        dir_sql = "DESC" if order.upper() == "DESC" else "ASC"

        where_clauses = []
        params = []

        if search:
            where_clauses.append("record_id LIKE ?")
            params.append(f"%{search}%")
        if quality_status:
            where_clauses.append("quality_status = ?")
            params.append(quality_status)
        if is_critical is not None:
            where_clauses.append("is_critical = ?")
            params.append(is_critical)

        where_str = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        with self._get_connection() as conn:
            cursor = conn.cursor()
            count_query = f"SELECT COUNT(*) FROM vital_records {where_str}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            query = f"SELECT * FROM vital_records {where_str} ORDER BY {col} {dir_sql} LIMIT ? OFFSET ?"
            cursor.execute(query, params + [limit, offset])
            rows = [dict(r) for r in cursor.fetchall()]
            return rows, total

    def get_record_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM vital_records WHERE record_id = ?", (record_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_record_scores_and_status(
        self,
        record_id: str,
        baseline_risk: float,
        ga_risk: float,
        quality_status: str
    ):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE vital_records
            SET baseline_risk = ?, ga_risk = ?, quality_status = ?
            WHERE record_id = ?
            """, (baseline_risk, ga_risk, quality_status, record_id))
            conn.commit()

    def record_count(self) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM vital_records")
            return cursor.fetchone()[0]

    # --- Experiments Management ---

    def log_experiment(self, exp_data: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO experiments (
                experiment_id, timestamp, record_id, perturbation_type,
                noise_std, dropped_fields, stale_minutes,
                baseline_before, baseline_after, ga_before, ga_after,
                delta_baseline, delta_ga, ghost_signal_type, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                exp_data["experiment_id"],
                exp_data.get("timestamp", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")),
                exp_data["record_id"],
                exp_data.get("perturbation_type", "CUSTOM"),
                float(exp_data.get("noise_std", 0.0)),
                json.dumps(exp_data.get("dropped_fields", [])),
                int(exp_data.get("stale_minutes", 0)),
                float(exp_data["baseline_before"]),
                float(exp_data["baseline_after"]),
                float(exp_data["ga_before"]),
                float(exp_data["ga_after"]),
                float(exp_data["delta_baseline"]),
                float(exp_data["delta_ga"]),
                exp_data.get("ghost_signal_type"),
                exp_data.get("notes")
            ))
            conn.commit()

    def get_experiments(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM experiments ORDER BY timestamp DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                try:
                    d["dropped_fields"] = json.loads(d.get("dropped_fields", "[]"))
                except Exception:
                    d["dropped_fields"] = []
                results.append(d)
            return results

    def export_experiments_csv(self) -> str:
        """Exports all experiment runs to CSV formatted string."""
        experiments = self.get_experiments(limit=1000)
        output = io.StringIO()
        fieldnames = [
            "experiment_id", "timestamp", "record_id", "perturbation_type",
            "noise_std", "dropped_fields", "stale_minutes",
            "baseline_before", "baseline_after", "ga_before", "ga_after",
            "delta_baseline", "delta_ga", "ghost_signal_type", "notes"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for exp in experiments:
            row = dict(exp)
            if isinstance(row.get("dropped_fields"), list):
                row["dropped_fields"] = ";".join(row["dropped_fields"])
            writer.writerow(row)
        return output.getvalue()
