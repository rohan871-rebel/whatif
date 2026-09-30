"""
Unit tests for Machine Learning Pipeline, Preprocessor, and GA Feature Selection.
"""

import numpy as np
import pandas as pd
from app.ml.synthetic_data import generate_synthetic_cohort
from app.ml.preprocessor import VitalPreprocessor
from app.ml.models import MLPipeline, GeneticAlgorithmFeatureSelector


def test_preprocessor_no_leakage():
    df = generate_synthetic_cohort(n_samples=50, random_seed=1)
    train_df = df.iloc[:35].copy()
    test_df = df.iloc[35:].copy()
    
    preprocessor = VitalPreprocessor(include_derived=True)
    preprocessor.fit(train_df)
    
    assert preprocessor.is_fitted
    # Imputation medians must come from train_df
    for feat in ["heart_rate", "spo2"]:
        assert abs(preprocessor.training_medians[feat] - train_df[feat].median()) < 1e-4

    # Transform test_df without error even if it has NaNs
    transformed_test = preprocessor.transform(test_df)
    assert not np.isnan(transformed_test).any()


def test_ml_pipeline_train_and_evaluate():
    df = generate_synthetic_cohort(n_samples=100, random_seed=42)
    pipeline = MLPipeline(random_seed=42)
    split_info = pipeline.train_pipeline(df)
    
    assert pipeline.is_trained
    assert split_info["n_train"] > 0
    assert split_info["n_val"] > 0
    assert split_info["n_test"] > 0
    assert len(pipeline.selected_feature_names) >= 2

    # Baseline evaluation
    base_eval = pipeline.evaluate_model(is_ga=False, threshold=0.50)
    assert 0.0 <= base_eval["auroc"] <= 1.0
    assert 0.0 <= base_eval["recall_sensitivity"] <= 1.0
    assert base_eval["mean_absolute_score_change"] >= 0.0

    # GA evaluation
    ga_eval = pipeline.evaluate_model(is_ga=True, threshold=0.50)
    assert 0.0 <= ga_eval["auroc"] <= 1.0
    assert len(ga_eval["selected_feature_names"]) == len(pipeline.selected_feature_names)


def test_predict_single_vitals():
    df = generate_synthetic_cohort(n_samples=80, random_seed=123)
    pipeline = MLPipeline(random_seed=123)
    pipeline.train_pipeline(df)

    vitals_critical = {
        "heart_rate": 140.0,
        "spo2": 82.0,
        "systolic_bp": 70.0,
        "diastolic_bp": 45.0,
        "respiratory_rate": 35.0,
        "temperature": 39.5
    }
    b_risk, ga_risk = pipeline.predict_vitals(vitals_critical)
    assert 0.0 <= b_risk <= 1.0
    assert 0.0 <= ga_risk <= 1.0
    # Patient in septic shock should have high predicted risk
    assert b_risk > 0.50
