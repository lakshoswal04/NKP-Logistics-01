from datetime import UTC, datetime

import pandas as pd

from app.ml import predict
from app.ml.datagen import generate_bookings, generate_shipments
from app.services.ai.route_optimizer import Stop, VehicleSpec, optimize_routes

NOW = datetime(2026, 7, 16, 10, 0, tzinfo=UTC)


def test_datagen_deterministic():
    a = generate_shipments(n=500)
    b = generate_shipments(n=500)
    pd.testing.assert_frame_equal(a, b)


def test_fraud_prevalence_calibrated():
    df = generate_bookings(n=20000)
    assert 0.015 < df["fraud"].mean() < 0.045


def test_eta_prediction_sane():
    r = predict.predict_eta("Mumbai", "Delhi", "ftl", 1200, NOW)
    assert 15 < r["predicted_hours"] < 90
    assert r["window_low_hours"] < r["predicted_hours"] < r["window_high_hours"]


def test_delay_prediction_bounds_and_factors():
    r = predict.predict_delay("kolkata", "guwahati", "ltl", 800, NOW)
    assert 0 <= r["delay_probability"] <= 1
    assert r["risk_level"] in ("low", "medium", "high")
    assert len(r["factors"]) >= 1
    # July = monsoon; the top factors should mention it for a sensitive lane
    labels = " ".join(f["label"].lower() for f in r["factors"])
    assert "monsoon" in labels


def test_fraud_scores_separate_clean_from_risky():
    clean = predict.predict_fraud(
        {
            "account_age_days": 900,
            "bookings_last_24h": 1,
            "declared_value_inr": 50000,
            "weight_kg": 500,
            "payment_cod": 0,
            "address_mismatch": 0,
            "night_booking": 0,
            "claims_ratio": 0.0,
            "new_lane_for_customer": 0,
        }
    )
    risky = predict.predict_fraud(
        {
            "account_age_days": 3,
            "bookings_last_24h": 6,
            "declared_value_inr": 2_000_000,
            "weight_kg": 100,
            "payment_cod": 1,
            "address_mismatch": 1,
            "night_booking": 1,
            "claims_ratio": 0.3,
            "new_lane_for_customer": 1,
        }
    )
    assert risky["fraud_probability"] > clean["fraud_probability"] + 0.3
    assert clean["risk_level"] == "low"
    assert risky["risk_level"] == "high"


def test_forecast_shapes():
    lane = predict.forecast_lanes()[0]
    f = predict.forecast_demand(lane, horizon_days=14)
    assert len(f["forecast"]) == 14
    assert len(f["history"]) == 90
    for p in f["forecast"]:
        assert p["low"] <= p["volume"] <= p["high"]


def test_route_optimizer_feasible():
    # deliberately scattered input order — optimizer should group by geography
    stops = [
        Stop("S1", "pune", 800),
        Stop("S2", "ahmedabad", 500),
        Stop("S3", "nashik", 600),
        Stop("S4", "surat", 900),
        Stop("S5", "vadodara", 700),
        Stop("S6", "indore", 400),
    ]
    vehicles = [VehicleSpec("Truck A", 2200), VehicleSpec("Truck B", 2200)]
    plan = optimize_routes("mumbai", stops, vehicles)

    assigned = [s["shipment_ref"] for r in plan["routes"] for s in r["stops"]]
    assert sorted(assigned) == ["S1", "S2", "S3", "S4", "S5", "S6"]
    assert plan["unassigned"] == 0
    for r in plan["routes"]:
        assert r["load_kg"] <= r["capacity_kg"]
    # the savings figure is clamped: never negative, even if the (capacity-blind)
    # naive baseline happens to be short
    assert plan["distance_saved_km"] >= 0


async def test_ai_endpoints(client):
    r = await client.get("/api/v1/ai/models")
    assert r.status_code == 200
    assert r.json()["eta"]["r2"] > 0.85

    r = await client.post(
        "/api/v1/ai/eta",
        json={
            "origin_city": "mumbai",
            "destination_city": "delhi",
            "shipment_type": "ftl",
            "weight_kg": 1000,
        },
    )
    assert r.status_code == 200
    assert "predicted_hours" in r.json()

    r = await client.post(
        "/api/v1/ai/delay-risk",
        json={"origin_city": "mumbai", "destination_city": "gotham"},
    )
    assert r.status_code == 422

    r = await client.post(
        "/api/v1/ai/fraud-risk",
        json={"account_age_days": 5, "bookings_last_24h": 4, "declared_value_inr": 900000, "weight_kg": 120},
    )
    assert r.status_code == 200
    assert 0 <= r.json()["fraud_probability"] <= 1

    lanes = (await client.get("/api/v1/ai/forecast/lanes")).json()["lanes"]
    r = await client.get("/api/v1/ai/forecast", params={"lane": lanes[0]})
    assert r.status_code == 200

    r = await client.post(
        "/api/v1/ai/route-optimize",
        json={
            "depot": "mumbai",
            "stops": [{"shipment_ref": "S1", "city": "pune", "load_kg": 500}],
            "vehicles": [{"name": "T1", "capacity_kg": 1000}],
        },
    )
    assert r.status_code == 200
    assert r.json()["unassigned"] == 0

    # admin-only queue requires auth
    r = await client.get("/api/v1/ai/insights/delay-queue")
    assert r.status_code == 401


async def test_copilot_intents(client):
    r = await client.post("/api/v1/ai/copilot", json={"question": "How many shipments are in transit?"})
    assert r.status_code == 200
    assert "shipment" in r.json()["answer"].lower()

    r = await client.post("/api/v1/ai/copilot", json={"question": "forecast Mumbai → Delhi"})
    assert r.status_code == 200

    r = await client.post("/api/v1/ai/copilot", json={"question": "sing me a song"})
    assert r.status_code == 200
    assert len(r.json()["suggestions"]) > 0
