"""
Leakage-Free Preprocessing Pipeline for Vital Signs Telemetry.
Strictly fits imputers and scalers on training splits only.
"""

from typing import Tuple, List, Dict, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler


BASE_VITAL_FEATURES = [
    "heart_rate",
    "spo2",
    "systolic_bp",
    "diastolic_bp",
    "respiratory_rate",
    "temperature"
]

ALL_DERIVED_FEATURES = BASE_VITAL_FEATURES + [
    "shock_index",       # heart_rate / systolic_bp
    "pulse_pressure",    # systolic_bp - diastolic_bp
    "mean_arterial_bp"   # diastolic_bp + 1/3 * pulse_pressure
]


class VitalPreprocessor:
    """
    Stateful preprocessor that fits median imputation and robust scaling
    exclusively on training data to avoid data leakage.
    """
    def __init__(self, include_derived: bool = True):
        self.include_derived = include_derived
        self.feature_names = ALL_DERIVED_FEATURES if include_derived else BASE_VITAL_FEATURES
        self.training_medians: Dict[str, float] = {}
        self.scaler = RobustScaler()
        self.is_fitted = False

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Computes derived hemodynamics safely with division-by-zero protection."""
        df = df.copy()
        
        # Base vital guarantees & clinical terminology aliasing (oxygen_saturation <-> spo2)
        if "oxygen_saturation" in df.columns:
            if "spo2" not in df.columns:
                df["spo2"] = df["oxygen_saturation"]
            else:
                df["spo2"] = df["spo2"].fillna(df["oxygen_saturation"])

        for col in BASE_VITAL_FEATURES:
            if col not in df.columns:
                df[col] = np.nan

        if self.include_derived:
            # Shock Index: HR / SBP (healthy ~ 0.5-0.7, shock > 0.9)
            safe_sbp = df["systolic_bp"].replace(0, np.nan)
            df["shock_index"] = df["heart_rate"] / safe_sbp
            
            # Pulse Pressure: SBP - DBP
            df["pulse_pressure"] = df["systolic_bp"] - df["diastolic_bp"]
            
            # Mean Arterial Pressure (MAP): DBP + 1/3 (SBP - DBP)
            # Synchronize canonical clinical name (mean_arterial_pressure) and internal alias (mean_arterial_bp)
            map_val = df["diastolic_bp"] + (df["pulse_pressure"] / 3.0)
            df["mean_arterial_bp"] = map_val
            df["mean_arterial_pressure"] = map_val
            
        return df

    def fit(self, X_train: pd.DataFrame) -> "VitalPreprocessor":
        """Computes imputation values and scaling parameters solely on X_train."""
        engineered = self._engineer_features(X_train)
        
        # Compute training medians
        for col in self.feature_names:
            median_val = engineered[col].median()
            # Fallback if all values are NaN in training column
            if pd.isna(median_val):
                default_defaults = {
                    "heart_rate": 75.0,
                    "spo2": 98.0,
                    "systolic_bp": 120.0,
                    "diastolic_bp": 80.0,
                    "respiratory_rate": 16.0,
                    "temperature": 37.0,
                    "shock_index": 0.62,
                    "pulse_pressure": 40.0,
                    "mean_arterial_bp": 93.3
                }
                median_val = default_defaults.get(col, 0.0)
            self.training_medians[col] = float(median_val)
            
        # Impute with fitted medians
        imputed_df = engineered[self.feature_names].fillna(self.training_medians)
        self.scaler.fit(imputed_df)
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transforms input using strictly pre-fitted medians and scaler."""
        if not self.is_fitted:
            raise ValueError("VitalPreprocessor must be fit on training data before transform.")
            
        engineered = self._engineer_features(X)
        imputed_df = engineered[self.feature_names].fillna(self.training_medians)
        scaled_array = self.scaler.transform(imputed_df)
        return scaled_array

    def fit_transform(self, X_train: pd.DataFrame) -> np.ndarray:
        return self.fit(X_train).transform(X_train)

    def transform_single_dict(self, vitals: Dict[str, Optional[float]]) -> np.ndarray:
        """Convenience method to preprocess a single record dictionary for inference."""
        df = pd.DataFrame([vitals])
        return self.transform(df)
