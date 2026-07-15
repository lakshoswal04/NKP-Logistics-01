"""Train and evaluate the four ML models on the synthetic dataset.

Run: python -m app.ml.train
Writes artifacts + honest held-out metrics to app/ml/artifacts/.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import (
    mean_absolute_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from app.ml.datagen import FORECAST_LANES, generate_bookings, generate_demand, generate_shipments

ARTIFACTS = Path(__file__).parent / "artifacts"

SHIPMENT_CAT = ["origin", "destination", "shipment_type"]
SHIPMENT_NUM = [
    "distance_km",
    "weight_kg",
    "month",
    "weekday",
    "pickup_hour",
    "lane_congestion",
    "lane_monsoon_sensitivity",
]
FRAUD_FEATURES = [
    "account_age_days",
    "bookings_last_24h",
    "declared_value_inr",
    "weight_kg",
    "value_per_kg",
    "payment_cod",
    "address_mismatch",
    "night_booking",
    "claims_ratio",
    "new_lane_for_customer",
]


def _shipment_pipeline(estimator) -> Pipeline:
    pre = ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), SHIPMENT_CAT),
            ("num", "passthrough", SHIPMENT_NUM),
        ]
    )
    return Pipeline([("pre", pre), ("model", estimator)])


def train_eta_and_delay() -> dict:
    df = generate_shipments()
    X = df[SHIPMENT_CAT + SHIPMENT_NUM]

    # ETA regressor
    y_eta = df["actual_hours"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y_eta, test_size=0.2, random_state=0)
    eta = _shipment_pipeline(HistGradientBoostingRegressor(max_iter=400, random_state=0))
    eta.fit(X_tr, y_tr)
    pred = eta.predict(X_te)
    resid_std = float(np.std(y_te - pred))
    eta_metrics = {
        "mae_hours": round(float(mean_absolute_error(y_te, pred)), 2),
        "r2": round(float(r2_score(y_te, pred)), 4),
        "residual_std_hours": round(resid_std, 2),
        "n_train": len(X_tr),
        "n_test": len(X_te),
    }
    joblib.dump(eta, ARTIFACTS / "eta.joblib")

    # Delay classifier
    y_delay = df["delayed"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y_delay, test_size=0.2, random_state=0, stratify=y_delay)
    delay = _shipment_pipeline(HistGradientBoostingClassifier(max_iter=400, random_state=0))
    delay.fit(X_tr, y_tr)
    proba = delay.predict_proba(X_te)[:, 1]
    delay_metrics = {
        "roc_auc": round(float(roc_auc_score(y_te, proba)), 4),
        "precision": round(float(precision_score(y_te, proba > 0.5)), 4),
        "recall": round(float(recall_score(y_te, proba > 0.5)), 4),
        "delay_rate": round(float(y_delay.mean()), 4),
        "n_train": len(X_tr),
        "n_test": len(X_te),
    }
    joblib.dump(delay, ARTIFACTS / "delay.joblib")
    return {"eta": eta_metrics, "delay": delay_metrics}


def train_fraud() -> dict:
    df = generate_bookings()
    X, y = df[FRAUD_FEATURES], df["fraud"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)
    model = HistGradientBoostingClassifier(max_iter=400, class_weight="balanced", random_state=0)
    model.fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]

    k = max(1, int(len(y_te) * 0.05))
    top_k = np.argsort(proba)[::-1][:k]
    metrics = {
        "roc_auc": round(float(roc_auc_score(y_te, proba)), 4),
        "precision_at_top5pct": round(float(y_te.iloc[top_k].mean()), 4),
        "fraud_rate": round(float(y.mean()), 4),
        "n_train": len(X_tr),
        "n_test": len(X_te),
    }
    joblib.dump(model, ARTIFACTS / "fraud.joblib")
    return metrics


def _fourier_features(dates: pd.DatetimeIndex) -> np.ndarray:
    """Trend + weekly/yearly Fourier terms — the demand forecaster's design matrix."""
    t = (dates - pd.Timestamp("2024-01-01")).days.to_numpy().astype(float)
    cols = [t / 365.0]
    for period, order in ((7.0, 3), (365.25, 4)):
        for k in range(1, order + 1):
            cols.append(np.sin(2 * np.pi * k * t / period))
            cols.append(np.cos(2 * np.pi * k * t / period))
    return np.column_stack(cols)


def train_forecast(holdout_days: int = 28) -> dict:
    df = generate_demand()
    models: dict[str, Ridge] = {}
    mapes = []
    for lane, g in df.groupby("lane"):
        g = g.sort_values("date")
        dates = pd.DatetimeIndex(g["date"])
        y = np.log1p(g["volume"].to_numpy().astype(float))
        X = _fourier_features(dates)

        X_tr, y_tr = X[:-holdout_days], y[:-holdout_days]
        X_te, y_true = X[-holdout_days:], g["volume"].to_numpy()[-holdout_days:]
        model = Ridge(alpha=1.0)
        model.fit(X_tr, y_tr)
        pred = np.expm1(model.predict(X_te)).clip(0)
        mape = float(np.mean(np.abs(pred - y_true) / np.maximum(y_true, 1)))
        mapes.append(mape)

        # refit on the full series for serving
        model_full = Ridge(alpha=1.0)
        model_full.fit(X, y)
        models[lane] = model_full

    joblib.dump(models, ARTIFACTS / "forecast.joblib")
    return {
        "mape_mean": round(float(np.mean(mapes)), 4),
        "mape_worst_lane": round(float(np.max(mapes)), 4),
        "lanes": len(FORECAST_LANES),
        "holdout_days": holdout_days,
        "history_days": 730,
    }


def main() -> None:
    ARTIFACTS.mkdir(exist_ok=True)
    metrics = train_eta_and_delay()
    metrics["fraud"] = train_fraud()
    metrics["forecast"] = train_forecast()
    metrics["trained_on"] = "synthetic v1 (retrain on real history once available)"
    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
