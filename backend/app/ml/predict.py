"""Serving layer over the trained artifacts.

Loads models once per process and exposes typed prediction functions with
human-readable factor breakdowns (transparent drivers, not post-hoc magic).
"""

import json
from datetime import datetime
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.ml.datagen import (
    FORECAST_LANES,
    TYPE_DWELL_H,
    TYPE_SPEED_MULT,
    generate_demand,
    lane_distance_km,
    lane_profiles,
)
from app.ml.train import _fourier_features

ARTIFACTS = Path(__file__).parent / "artifacts"


@lru_cache
def _load(name: str):
    return joblib.load(ARTIFACTS / f"{name}.joblib")


@lru_cache
def model_metrics() -> dict:
    return json.loads((ARTIFACTS / "metrics.json").read_text())


class UnknownLaneError(ValueError):
    pass


def _shipment_features(
    origin: str, destination: str, shipment_type: str, weight_kg: float, pickup: datetime
) -> pd.DataFrame:
    o, d = origin.strip().lower(), destination.strip().lower()
    profile = lane_profiles().get((o, d))
    if profile is None:
        raise UnknownLaneError(f"Unknown lane {origin!r} → {destination!r}")
    return pd.DataFrame(
        [
            {
                "origin": o,
                "destination": d,
                "distance_km": round(lane_distance_km(o, d), 1),
                "shipment_type": shipment_type,
                "weight_kg": weight_kg,
                "month": pickup.month,
                "weekday": pickup.weekday(),
                "pickup_hour": pickup.hour,
                "lane_congestion": profile.congestion,
                "lane_monsoon_sensitivity": profile.monsoon_sensitivity,
            }
        ]
    )


def predict_eta(
    origin: str, destination: str, shipment_type: str, weight_kg: float, pickup: datetime
) -> dict:
    X = _shipment_features(origin, destination, shipment_type, weight_kg, pickup)
    hours = float(_load("eta").predict(X)[0])
    resid = model_metrics()["eta"]["residual_std_hours"]
    planned = (
        X.at[0, "distance_km"] / (38.0 * TYPE_SPEED_MULT[shipment_type]) + TYPE_DWELL_H[shipment_type] + 2.0
    )
    return {
        "predicted_hours": round(hours, 1),
        "window_low_hours": round(max(hours - resid, 1.0), 1),
        "window_high_hours": round(hours + resid, 1),
        "planned_hours": round(planned, 1),
        "distance_km": float(X.at[0, "distance_km"]),
    }


def _delay_factors(X: pd.DataFrame) -> list[dict]:
    """Transparent driver breakdown for the delay score."""
    row = X.iloc[0]
    factors = []
    if row["month"] in (6, 7, 8, 9):
        factors.append(
            {
                "label": "Monsoon season on this lane",
                "impact": round(0.35 + row["lane_monsoon_sensitivity"], 2),
            }
        )
    if row["month"] in (10, 11):
        factors.append({"label": "Festival-season congestion", "impact": 0.3})
    if row["lane_congestion"] > 1.3:
        factors.append(
            {"label": "Heavily congested corridor", "impact": round(row["lane_congestion"] - 1.0, 2)}
        )
    elif row["lane_congestion"] > 1.15:
        factors.append(
            {"label": "Moderate corridor congestion", "impact": round(row["lane_congestion"] - 1.0, 2)}
        )
    if row["weekday"] >= 5:
        factors.append({"label": "Weekend receiving delays at destination", "impact": 0.2})
    if row["pickup_hour"] >= 22 or row["pickup_hour"] <= 4:
        factors.append({"label": "Night pickup slot", "impact": 0.15})
    if row["distance_km"] > 1200:
        factors.append({"label": "Long-haul lane (driver rest stops)", "impact": 0.18})
    if row["shipment_type"] == "ltl":
        factors.append({"label": "Part-load consolidation dwell", "impact": 0.22})
    if not factors:
        factors.append({"label": "No elevated risk drivers detected", "impact": 0.0})
    return sorted(factors, key=lambda f: -f["impact"])[:4]


def predict_delay(
    origin: str, destination: str, shipment_type: str, weight_kg: float, pickup: datetime
) -> dict:
    X = _shipment_features(origin, destination, shipment_type, weight_kg, pickup)
    prob = float(_load("delay").predict_proba(X)[0, 1])
    level = "high" if prob >= 0.6 else ("medium" if prob >= 0.35 else "low")
    return {"delay_probability": round(prob, 3), "risk_level": level, "factors": _delay_factors(X)}


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


def _fraud_reasons(row: dict) -> list[dict]:
    reasons = []
    if row["account_age_days"] < 30:
        reasons.append({"label": "Account created less than 30 days ago", "impact": 0.4})
    if row["bookings_last_24h"] >= 3:
        reasons.append({"label": f"{row['bookings_last_24h']} bookings in the last 24h", "impact": 0.35})
    if row["value_per_kg"] > 2000:
        reasons.append({"label": "Unusually high declared value per kg", "impact": 0.35})
    if row["address_mismatch"]:
        reasons.append({"label": "Billing / pickup address mismatch", "impact": 0.45})
    if row["payment_cod"] and row["night_booking"]:
        reasons.append({"label": "COD booking placed at night", "impact": 0.3})
    if row["claims_ratio"] > 0.15:
        reasons.append({"label": "Elevated historical claims ratio", "impact": 0.5})
    if row["new_lane_for_customer"]:
        reasons.append({"label": "First booking on this lane", "impact": 0.12})
    if not reasons:
        reasons.append({"label": "No fraud signatures triggered", "impact": 0.0})
    return sorted(reasons, key=lambda r: -r["impact"])[:4]


def predict_fraud(signals: dict) -> dict:
    row = {
        **signals,
        "value_per_kg": round(signals["declared_value_inr"] / max(signals["weight_kg"], 1), 1),
    }
    X = pd.DataFrame([[row[f] for f in FRAUD_FEATURES]], columns=FRAUD_FEATURES)
    prob = float(_load("fraud").predict_proba(X)[0, 1])
    level = "high" if prob >= 0.5 else ("medium" if prob >= 0.2 else "low")
    return {"fraud_probability": round(prob, 3), "risk_level": level, "reasons": _fraud_reasons(row)}


@lru_cache
def _demand_history() -> pd.DataFrame:
    return generate_demand()


def forecast_lanes() -> list[str]:
    return [f"{o.title()} → {d.title()}" for o, d in FORECAST_LANES]


def forecast_demand(lane: str, horizon_days: int = 28, history_days: int = 90) -> dict:
    models: dict = _load("forecast")
    if lane not in models:
        raise UnknownLaneError(f"No forecast model for lane {lane!r}")

    hist = _demand_history()
    g = hist[hist["lane"] == lane].sort_values("date").tail(history_days)
    last_date = pd.Timestamp(g["date"].max())
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=horizon_days, freq="D")
    pred = np.expm1(models[lane].predict(_fourier_features(future_dates))).clip(0)

    mape = model_metrics()["forecast"]["mape_mean"]
    return {
        "lane": lane,
        "history": [
            {"date": d.strftime("%Y-%m-%d"), "volume": int(v)}
            for d, v in zip(g["date"], g["volume"], strict=True)
        ],
        "forecast": [
            {
                "date": d.strftime("%Y-%m-%d"),
                "volume": round(float(v), 1),
                "low": round(float(v) * (1 - mape), 1),
                "high": round(float(v) * (1 + mape), 1),
            }
            for d, v in zip(future_dates, pred, strict=True)
        ],
    }
