"""
GHOST SIGNAL — WHAT IF?
Configuration and settings module.
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "ghost_signal.db"

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# CORS Configuration
_allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [orig.strip() for orig in _allowed_origins_raw.split(",") if orig.strip()]

# Security & Upload Guardrails
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
MIN_CSV_ROWS = int(os.getenv("MIN_CSV_ROWS", "20"))
MAX_CSV_ROWS = int(os.getenv("MAX_CSV_ROWS", "5000"))

# Random Seeds & Splits
RANDOM_SEED = int(os.getenv("RANDOM_SEED", "42"))
TRAIN_RATIO = 0.60
VAL_RATIO = 0.20
TEST_RATIO = 0.20

# Safety and Research Disclaimers
RESEARCH_DISCLAIMER = (
    "Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions. "
    "Risk scores are uncalibrated statistical model outputs and must not be interpreted as validated clinical probabilities."
)

SYNTHETIC_DATA_LABEL = "SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE"
