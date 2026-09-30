"""
Machine Learning Pipelines: Baseline Random Forest and Genetic Algorithm (GA) Feature Selector.
Ensures strict separation of train, validation, and untouched held-out test splits.
Evaluates both models under identical perturbation protocols.
"""

from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, roc_curve, confusion_matrix, brier_score_loss, f1_score
from sklearn.model_selection import train_test_split

from app.config import RANDOM_SEED, TRAIN_RATIO, VAL_RATIO, TEST_RATIO
from app.ml.preprocessor import VitalPreprocessor, ALL_DERIVED_FEATURES


class GeneticAlgorithmFeatureSelector:
    """
    Genetic Algorithm that optimizes a binary feature mask.
    Chromosome: binary array of length N_features (1 = include, 0 = exclude).
    Fitness function: Balances Validation AUROC, Feature Parsimony, and Resilience to Sensor Perturbation.
    """
    def __init__(
        self,
        n_features: int,
        population_size: int = 24,
        generations: int = 12,
        mutation_rate: float = 0.15,
        crossover_rate: float = 0.80,
        random_seed: int = RANDOM_SEED
    ):
        self.n_features = n_features
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.rng = np.random.RandomState(random_seed)
        self.best_chromosome: Optional[np.ndarray] = None
        self.best_fitness: float = -float("inf")
        self.history: List[Dict[str, Any]] = []

    def _init_population(self) -> np.ndarray:
        # Initialize random chromosomes; ensure each has at least 2 active features
        pop = self.rng.choice([0, 1], size=(self.population_size, self.n_features), p=[0.4, 0.6])
        for i in range(self.population_size):
            if np.sum(pop[i]) < 2:
                idx = self.rng.choice(self.n_features, size=3, replace=False)
                pop[i, idx] = 1
        return pop

    def _evaluate_chromosome(
        self,
        chromosome: np.ndarray,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        X_val_perturbed: np.ndarray
    ) -> float:
        active_indices = np.where(chromosome == 1)[0]
        if len(active_indices) < 2:
            return -10.0  # Heavy penalty for selecting fewer than 2 features

        X_tr_sub = X_train[:, active_indices]
        X_val_sub = X_val[:, active_indices]
        X_val_pert_sub = X_val_perturbed[:, active_indices]

        clf = RandomForestClassifier(
            n_estimators=50,
            max_depth=5,
            random_state=RANDOM_SEED,
            class_weight="balanced",
            n_jobs=-1
        )
        clf.fit(X_tr_sub, y_train)

        # Val AUROC
        val_probs = clf.predict_proba(X_val_sub)[:, 1]
        try:
            val_auroc = float(roc_auc_score(y_val, val_probs))
        except Exception:
            val_auroc = 0.50

        # Perturbation Sensitivity: average absolute shift under noise
        val_pert_probs = clf.predict_proba(X_val_pert_sub)[:, 1]
        sensitivity = float(np.mean(np.abs(val_probs - val_pert_probs)))

        # Feature parsimony penalty
        sparsity_penalty = (len(active_indices) / self.n_features) * 0.06

        # Multi-objective fitness: High AUROC + Low Perturbation Vulnerability + Reasonable Parsimony
        fitness = val_auroc - (0.28 * sensitivity) - sparsity_penalty
        return fitness

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> np.ndarray:
        # Pre-generate perturbed validation set for sensitivity scoring
        val_std = np.std(X_val, axis=0, keepdims=True)
        val_std[val_std == 0] = 1.0
        noise = self.rng.normal(0, 0.25 * val_std, size=X_val.shape)
        X_val_perturbed = X_val + noise

        pop = self._init_population()

        for gen in range(self.generations):
            fitness_scores = np.array([
                self._evaluate_chromosome(chrom, X_train, y_train, X_val, y_val, X_val_perturbed)
                for chrom in pop
            ])

            # Track generation best
            best_idx = int(np.argmax(fitness_scores))
            gen_best_fitness = float(fitness_scores[best_idx])
            gen_best_chrom = pop[best_idx].copy()

            if gen_best_fitness > self.best_fitness:
                self.best_fitness = gen_best_fitness
                self.best_chromosome = gen_best_chrom.copy()

            self.history.append({
                "generation": gen + 1,
                "best_fitness": round(gen_best_fitness, 4),
                "mean_fitness": round(float(np.mean(fitness_scores)), 4),
                "active_features": int(np.sum(gen_best_chrom))
            })

            # Selection: Tournament selection
            new_pop = []
            # Elitism: retain top 2 chromosomes
            top_2_indices = np.argsort(fitness_scores)[-2:]
            new_pop.append(pop[top_2_indices[1]].copy())
            new_pop.append(pop[top_2_indices[0]].copy())

            while len(new_pop) < self.population_size:
                # Tournament
                t1 = self.rng.choice(self.population_size, size=3, replace=False)
                p1 = pop[t1[np.argmax(fitness_scores[t1])]]
                t2 = self.rng.choice(self.population_size, size=3, replace=False)
                p2 = pop[t2[np.argmax(fitness_scores[t2])]]

                # Crossover
                if self.rng.rand() < self.crossover_rate:
                    point = self.rng.randint(1, self.n_features)
                    c1 = np.concatenate([p1[:point], p2[point:]])
                    c2 = np.concatenate([p2[:point], p1[point:]])
                else:
                    c1, c2 = p1.copy(), p2.copy()

                # Mutation
                for child in [c1, c2]:
                    for bit in range(self.n_features):
                        if self.rng.rand() < self.mutation_rate:
                            child[bit] = 1 - child[bit]
                    if np.sum(child) < 2:
                        child[self.rng.choice(self.n_features)] = 1
                    if len(new_pop) < self.population_size:
                        new_pop.append(child)

            pop = np.array(new_pop)

        return self.best_chromosome if self.best_chromosome is not None else pop[0]


class MLPipeline:
    """
    Manages data splitting, preprocessing, model training, and comparative evaluation.
    Evaluates baseline RF (all features) vs GA-selected RF.
    """
    def __init__(self, random_seed: int = RANDOM_SEED):
        self.random_seed = random_seed
        self.preprocessor = VitalPreprocessor(include_derived=True)
        self.all_feature_names = self.preprocessor.feature_names
        self.baseline_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=random_seed,
            class_weight="balanced",
            n_jobs=-1
        )
        self.ga_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=random_seed,
            class_weight="balanced",
            n_jobs=-1
        )
        self.ga_mask: Optional[np.ndarray] = None
        self.selected_feature_names: List[str] = []
        self.is_trained = False
        
        # Stored splits for reproducibility
        self.test_df: Optional[pd.DataFrame] = None
        self.X_test: Optional[np.ndarray] = None
        self.y_test: Optional[np.ndarray] = None
        self.X_test_perturbed: Optional[np.ndarray] = None

    def train_pipeline(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Splits data into 60% Train, 20% Validation, 20% Held-Out Test.
        Fits preprocessor ONLY on Train.
        Runs GA Feature Selection on Train + Val.
        Trains final models and preserves Test split for evaluation.
        """
        if "is_critical" not in df.columns:
            raise ValueError("Input dataframe missing mandatory target column 'is_critical'.")

        y = df["is_critical"].astype(int).values
        
        # 1. Stratified split: Train+Val (80%) vs Test (20%)
        df_train_val, df_test, y_train_val, y_test = train_test_split(
            df, y, test_size=TEST_RATIO, random_state=self.random_seed, stratify=y
        )
        
        # 2. Stratified split: Train (75% of 80% = 60%) vs Val (25% of 80% = 20%)
        val_relative_size = VAL_RATIO / (TRAIN_RATIO + VAL_RATIO)  # 0.25
        df_train, df_val, y_train, y_val = train_test_split(
            df_train_val, y_train_val, test_size=val_relative_size,
            random_state=self.random_seed, stratify=y_train_val
        )

        # 3. Fit preprocessor STRICTLY on Training Split
        self.preprocessor.fit(df_train)
        
        # Transform splits
        X_train = self.preprocessor.transform(df_train)
        X_val = self.preprocessor.transform(df_val)
        X_test = self.preprocessor.transform(df_test)

        # 4. Train Baseline Model (all features)
        self.baseline_model.fit(X_train, y_train)

        # 5. Run Genetic Algorithm to select robust feature subset
        ga_selector = GeneticAlgorithmFeatureSelector(
            n_features=len(self.all_feature_names),
            population_size=24,
            generations=12,
            random_seed=self.random_seed
        )
        self.ga_mask = ga_selector.fit(X_train, y_train, X_val, y_val)
        active_indices = np.where(self.ga_mask == 1)[0]
        self.selected_feature_names = [self.all_feature_names[i] for i in active_indices]

        # 6. Train GA Model on selected features
        X_train_ga = X_train[:, active_indices]
        self.ga_model.fit(X_train_ga, y_train)

        # 7. Create Test Perturbation Protocol for Robustness Comparison
        rng = np.random.RandomState(self.random_seed)
        test_std = np.std(X_test, axis=0, keepdims=True)
        test_std[test_std == 0] = 1.0
        # 20% Gaussian noise perturbation
        test_noise = rng.normal(0, 0.20 * test_std, size=X_test.shape)
        X_test_perturbed = X_test + test_noise

        self.test_df = df_test.copy()
        self.X_test = X_test
        self.y_test = y_test
        self.X_test_perturbed = X_test_perturbed
        self.is_trained = True

        return {
            "n_train": len(df_train),
            "n_val": len(df_val),
            "n_test": len(df_test),
            "selected_features": self.selected_feature_names,
            "feature_mask": [int(x) for x in self.ga_mask]
        }

    def evaluate_model(
        self,
        is_ga: bool,
        threshold: float = 0.50
    ) -> Dict[str, Any]:
        """
        Calculates AUROC, recall, false-negative rate, confusion matrix,
        and mean absolute score change under perturbation on untouched held-out test data.
        """
        if not self.is_trained or self.X_test is None or self.y_test is None:
            raise ValueError("Models must be trained before evaluation.")

        active_indices = np.where(self.ga_mask == 1)[0] if is_ga else np.arange(len(self.all_feature_names))
        model = self.ga_model if is_ga else self.baseline_model

        X_eval = self.X_test[:, active_indices]
        X_eval_pert = self.X_test_perturbed[:, active_indices]

        # Clean predictions
        clean_probs = model.predict_proba(X_eval)[:, 1]
        
        # Perturbed predictions (under identical noise)
        pert_probs = model.predict_proba(X_eval_pert)[:, 1]
        masc = float(np.mean(np.abs(clean_probs - pert_probs)))

        # AUROC
        try:
            auroc = float(roc_auc_score(self.y_test, clean_probs))
        except Exception:
            auroc = 0.50

        # Predictions at decision threshold
        preds = (clean_probs >= threshold).astype(int)
        cm = confusion_matrix(self.y_test, preds, labels=[0, 1])
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

        critical_count = int(np.sum(self.y_test == 1))
        recall = float(tp / critical_count) if critical_count > 0 else 0.0
        fnr = float(fn / critical_count) if critical_count > 0 else 0.0

        # Calibration & classification metrics on held-out test records
        try:
            brier = float(brier_score_loss(self.y_test, clean_probs))
        except Exception:
            brier = 0.0

        try:
            f1 = float(f1_score(self.y_test, preds, zero_division=0))
        except Exception:
            f1 = 0.0

        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        accuracy = float((tp + tn) / len(self.y_test)) if len(self.y_test) > 0 else 0.0

        # ROC Curve points (downsampled to 20 representative points for responsive charts)
        fpr, tpr, _ = roc_curve(self.y_test, clean_probs)
        step = max(1, len(fpr) // 20)
        roc_pts = [
            {"fpr": round(float(fpr[i]), 3), "tpr": round(float(tpr[i]), 3)}
            for i in range(0, len(fpr), step)
        ]
        if roc_pts[-1] != {"fpr": 1.0, "tpr": 1.0}:
            roc_pts.append({"fpr": 1.0, "tpr": 1.0})

        return {
            "model_name": "Genetic Algorithm RF" if is_ga else "Baseline Random Forest",
            "model_version": "v1.0-GA-Robust" if is_ga else "v1.0-Baseline-AllFeatures",
            "auroc": round(auroc, 4),
            "recall_sensitivity": round(recall, 4),
            "false_negative_rate": round(fnr, 4),
            "false_negative_count": fn,
            "critical_cases_count": critical_count,
            "mean_absolute_score_change": round(masc, 4),
            "brier_score": round(brier, 4),
            "f1_score": round(f1, 4),
            "specificity": round(specificity, 4),
            "accuracy": round(accuracy, 4),
            "selected_features_count": len(active_indices),
            "selected_feature_names": [self.all_feature_names[i] for i in active_indices],
            "all_feature_names": self.all_feature_names,
            "feature_mask": [int(i in active_indices) for i in range(len(self.all_feature_names))],
            "decision_threshold": threshold,
            "evaluation_split": "Untouched held-out test split (20% of cohort, stratified)",
            "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
            "roc_curve": roc_pts,
            "disclaimer": (
                "Evaluated on held-out test records using reproducible seed 42. "
                "Performance reflects synthetic benchmark distributions and does not establish clinical efficacy."
            )
        }

    def get_robustness_curve(self, sigmas: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        """
        Calculates mean absolute prediction drift across an injected Gaussian noise spectrum
        comparing Baseline RF vs GA-Selected RF on identical held-out test data.
        """
        if not self.is_trained or self.X_test is None:
            raise ValueError("Pipeline must be trained before generating robustness curve.")

        sigmas = sigmas or [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
        active_indices = np.where(self.ga_mask == 1)[0]

        # Clean baseline and GA probabilities on test set
        base_clean_probs = self.baseline_model.predict_proba(self.X_test)[:, 1]
        ga_clean_probs = self.ga_model.predict_proba(self.X_test[:, active_indices])[:, 1]

        curve_points = []
        rng = np.random.RandomState(self.random_seed)
        test_std = np.std(self.X_test, axis=0, keepdims=True)
        test_std[test_std == 0] = 1.0

        for sig in sigmas:
            if sig == 0.0:
                base_drift = 0.0
                ga_drift = 0.0
                gain = 0.0
            else:
                noise = rng.normal(0, sig * test_std, size=self.X_test.shape)
                X_pert = self.X_test + noise

                base_pert_probs = self.baseline_model.predict_proba(X_pert)[:, 1]
                ga_pert_probs = self.ga_model.predict_proba(X_pert[:, active_indices])[:, 1]

                base_drift = float(np.mean(np.abs(base_clean_probs - base_pert_probs)))
                ga_drift = float(np.mean(np.abs(ga_clean_probs - ga_pert_probs)))
                gain = round(((base_drift - ga_drift) / base_drift) * 100.0, 1) if base_drift > 0 else 0.0

            curve_points.append({
                "noise_sigma": round(float(sig), 2),
                "baseline_drift": round(base_drift, 4),
                "ga_drift": round(ga_drift, 4),
                "robustness_gain_percent": gain
            })

        return curve_points

    def predict_vitals(self, vitals: Dict[str, Optional[float]]) -> Tuple[float, float]:
        """
        Runs inference through both Baseline and GA models for a single record.
        Returns (baseline_risk, ga_risk).
        """
        if not self.is_trained:
            raise ValueError("Models are not trained.")

        X = self.preprocessor.transform_single_dict(vitals)
        
        # Baseline uses all features
        baseline_risk = float(self.baseline_model.predict_proba(X)[:, 1][0])

        # GA uses selected subset
        active_indices = np.where(self.ga_mask == 1)[0]
        X_ga = X[:, active_indices]
        ga_risk = float(self.ga_model.predict_proba(X_ga)[:, 1][0])

        return round(baseline_risk, 4), round(ga_risk, 4)
