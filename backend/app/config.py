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

# Random Seeds & Splits
RANDOM_SEED = 42
TRAIN_RATIO = 0.60
VAL_RATIO = 0.20
TEST_RATIO = 0.20

# Safety and Research Disclaimers
RESEARCH_DISCLAIMER = (
    "Research demonstration only. Not for diagnosis, triage, treatment, or real-patient decisions. "
    "Risk scores are uncalibrated statistical model outputs and must not be interpreted as validated clinical probabilities."
)

SYNTHETIC_DATA_LABEL = "SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE"
