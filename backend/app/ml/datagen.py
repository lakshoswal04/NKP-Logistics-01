"""Synthetic training data for the NKP AI layer.

No real shipment history exists yet, so models train on a generated dataset
whose causal structure mirrors Indian road freight: lane distance and
congestion drive transit time, monsoon (Jun-Sep) and festival season (Oct-Nov)
slow specific corridors, and fraud follows recognizable booking signatures.
Every generator is deterministic for a given seed. When real data accumulates,
`train.py` retrains on it with the same feature schema.
"""

from dataclasses import dataclass
from functools import lru_cache

import numpy as np
import pandas as pd

from app.services.maps.cities import CITY_COORDS
from app.services.maps.mock import ROAD_FACTOR, haversine_km

SEED = 42

CITIES = sorted({c for c in CITY_COORDS if c != "bangalore"})  # drop alias

SHIPMENT_TYPES = ["ftl", "ltl", "express", "last_mile"]
TYPE_SPEED_MULT = {"ftl": 1.0, "ltl": 0.82, "express": 1.18, "last_mile": 0.7}
TYPE_DWELL_H = {"ftl": 4.0, "ltl": 10.0, "express": 2.0, "last_mile": 6.0}

# Top lanes get a demand time series (lane = "origin→destination")
FORECAST_LANES = [
    ("mumbai", "delhi"),
    ("delhi", "mumbai"),
    ("mumbai", "bengaluru"),
    ("bengaluru", "chennai"),
    ("delhi", "jaipur"),
    ("ahmedabad", "mumbai"),
    ("hyderabad", "bengaluru"),
    ("kolkata", "guwahati"),
    ("pune", "hyderabad"),
    ("surat", "delhi"),
    ("chennai", "coimbatore"),
    ("indore", "nagpur"),
]


def lane_distance_km(origin: str, destination: str) -> float:
    if origin == destination:
        return 25.0
    return haversine_km(CITY_COORDS[origin], CITY_COORDS[destination]) * ROAD_FACTOR


@dataclass(frozen=True)
class LaneProfile:
    congestion: float  # 1.0 = free-flowing, up to ~1.5
    highway_speed: float  # km/h effective line-haul speed
    monsoon_sensitivity: float  # extra slowdown factor during monsoon


def _lane_profiles(rng: np.random.Generator) -> dict[tuple[str, str], LaneProfile]:
    profiles = {}
    for o in CITIES:
        for d in CITIES:
            if o == d:
                continue
            profiles[(o, d)] = LaneProfile(
                congestion=float(rng.uniform(1.0, 1.45)),
                highway_speed=float(rng.uniform(36.0, 54.0)),
                monsoon_sensitivity=float(rng.uniform(0.05, 0.35)),
            )
    return profiles


@lru_cache
def lane_profiles() -> dict[tuple[str, str], LaneProfile]:
    """Deterministic lane profiles shared by training and inference."""
    return _lane_profiles(np.random.default_rng(SEED + 1))


def _month_factor(month: np.ndarray, monsoon_sensitivity: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Seasonal slowdown multiplier per shipment."""
    monsoon = np.isin(month, [6, 7, 8, 9]).astype(float)
    festival = np.isin(month, [10, 11]).astype(float)
    return 1.0 + monsoon * monsoon_sensitivity + festival * rng.uniform(0.05, 0.18, size=len(month))


def generate_shipments(n: int = 50_000, seed: int = SEED) -> pd.DataFrame:
    """Shipment-level dataset for the ETA regressor and delay classifier."""
    rng = np.random.default_rng(seed)
    profiles = _lane_profiles(np.random.default_rng(seed + 1))

    origins = rng.choice(CITIES, size=n)
    dest = rng.choice(CITIES, size=n)
    same = origins == dest
    dest[same] = np.roll(dest[same], 1) if same.sum() > 1 else "pune"
    dest[origins == dest] = np.where(origins[origins == dest] == "pune", "mumbai", "pune")

    stype = rng.choice(SHIPMENT_TYPES, size=n, p=[0.35, 0.35, 0.18, 0.12])
    weight = np.round(np.exp(rng.normal(6.2, 1.1, n)).clip(20, 25000), 0)  # kg, lognormal
    month = rng.integers(1, 13, n)
    weekday = rng.integers(0, 7, n)
    pickup_hour = rng.integers(0, 24, n)

    distance = np.array([lane_distance_km(o, d) for o, d in zip(origins, dest, strict=True)])
    congestion = np.array([profiles[(o, d)].congestion for o, d in zip(origins, dest, strict=True)])
    speed = np.array([profiles[(o, d)].highway_speed for o, d in zip(origins, dest, strict=True)])
    monsoon_sens = np.array(
        [profiles[(o, d)].monsoon_sensitivity for o, d in zip(origins, dest, strict=True)]
    )

    type_speed = np.array([TYPE_SPEED_MULT[t] for t in stype])
    dwell = np.array([TYPE_DWELL_H[t] for t in stype])

    season = _month_factor(month, monsoon_sens, rng)
    weekend_dwell = np.where(weekday >= 5, 3.0, 0.0)  # weekend receiving delays
    night_start_penalty = np.where((pickup_hour >= 22) | (pickup_hour <= 4), 1.5, 0.0)
    weight_drag = 1.0 + (weight / 25000.0) * 0.08

    line_haul = distance / (speed * type_speed) * congestion * season * weight_drag
    noise = rng.lognormal(mean=0.0, sigma=0.13, size=n)
    actual_hours = (line_haul + dwell + weekend_dwell + night_start_penalty) * noise

    # Plan: typical network speed with a modest buffer; delayed = 15% over promise.
    # Congestion/season are what the plan can't see per-shipment — that's the
    # signal the classifier learns from lane + calendar features.
    planned_hours = distance / (38.0 * type_speed) + dwell + 2.0
    delayed = (actual_hours > planned_hours * 1.15).astype(int)

    return pd.DataFrame(
        {
            "origin": origins,
            "destination": dest,
            "distance_km": np.round(distance, 1),
            "shipment_type": stype,
            "weight_kg": weight,
            "month": month,
            "weekday": weekday,
            "pickup_hour": pickup_hour,
            "lane_congestion": np.round(congestion, 3),
            "lane_monsoon_sensitivity": np.round(monsoon_sens, 3),
            "actual_hours": np.round(actual_hours, 2),
            "planned_hours": np.round(planned_hours, 2),
            "delayed": delayed,
        }
    )


def generate_bookings(n: int = 60_000, seed: int = SEED) -> pd.DataFrame:
    """Booking-level dataset for the fraud classifier (~2.5% fraud prevalence)."""
    rng = np.random.default_rng(seed + 7)

    account_age_days = np.round(np.exp(rng.normal(4.6, 1.4, n))).clip(0, 3000)
    bookings_24h = rng.poisson(0.8, n).clip(0, 15)
    declared_value = np.round(np.exp(rng.normal(10.4, 1.2, n)).clip(2000, 8_000_000), -2)
    weight = np.round(np.exp(rng.normal(6.0, 1.1, n)).clip(20, 25000), 0)
    value_per_kg = declared_value / weight
    payment_cod = rng.binomial(1, 0.3, n)
    address_mismatch = rng.binomial(1, 0.08, n)
    night_booking = rng.binomial(1, 0.15, n)
    claims_ratio = np.round(rng.beta(1.2, 20, n), 3)  # past claims / shipments
    new_lane = rng.binomial(1, 0.35, n)

    # Fraud propensity: young accounts, velocity, value density, mismatches, COD at night
    raw_logit = (
        -0.010 * account_age_days
        + 0.85 * bookings_24h
        + 1.2 * np.log1p(value_per_kg / 300)
        + 2.4 * address_mismatch
        + 1.6 * payment_cod * night_booking
        + 10.0 * claims_ratio
        + 0.7 * new_lane
    )
    # Sharpen separation between clean and fraudulent signatures, then
    # calibrate the intercept so overall prevalence lands at ~2.5%
    raw_logit = 1.8 * (raw_logit - np.median(raw_logit))
    target_rate = 0.025
    lo, hi = -20.0, 5.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if (1 / (1 + np.exp(-(raw_logit + mid)))).mean() > target_rate:
            hi = mid
        else:
            lo = mid
    p = 1 / (1 + np.exp(-(raw_logit + (lo + hi) / 2)))
    fraud = rng.binomial(1, p.clip(0, 0.97))
    # small label noise, mimicking imperfect fraud investigations
    flip = rng.random(n) < 0.002
    fraud = np.where(flip, 1 - fraud, fraud)

    return pd.DataFrame(
        {
            "account_age_days": account_age_days,
            "bookings_last_24h": bookings_24h,
            "declared_value_inr": declared_value,
            "weight_kg": weight,
            "value_per_kg": np.round(value_per_kg, 1),
            "payment_cod": payment_cod,
            "address_mismatch": address_mismatch,
            "night_booking": night_booking,
            "claims_ratio": claims_ratio,
            "new_lane_for_customer": new_lane,
            "fraud": fraud,
        }
    )


def generate_demand(days: int = 730, seed: int = SEED) -> pd.DataFrame:
    """Daily shipment volume per major lane, with trend + weekly/yearly seasonality."""
    rng = np.random.default_rng(seed + 21)
    end = pd.Timestamp("2026-07-15")
    dates = pd.date_range(end=end, periods=days, freq="D")
    frames = []
    for origin, destination in FORECAST_LANES:
        base = rng.uniform(18, 70)
        growth = rng.uniform(0.00015, 0.0007)  # gentle daily compounding growth
        weekly = rng.uniform(0.12, 0.3)
        t = np.arange(days)
        doy = dates.dayofyear.to_numpy()
        weekday = dates.weekday.to_numpy()

        level = base * (1 + growth) ** t
        weekly_season = (
            1 - weekly * np.isin(weekday, [6]).astype(float) - weekly * 0.5 * np.isin(weekday, [5])
        )
        festival = 1 + 0.35 * np.exp(-0.5 * ((doy - 305) / 12.0) ** 2)  # Diwali window spike
        monsoon = 1 - 0.12 * np.isin(dates.month, [7, 8]).astype(float)
        lam = level * weekly_season * festival * monsoon
        volume = rng.poisson(lam)

        frames.append(
            pd.DataFrame(
                {
                    "date": dates,
                    "lane": f"{origin.title()} → {destination.title()}",
                    "volume": volume,
                }
            )
        )
    return pd.concat(frames, ignore_index=True)
