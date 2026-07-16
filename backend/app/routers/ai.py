from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import require_role
from app.core.limiter import limiter
from app.db import get_db
from app.ml import predict
from app.models import Shipment, ShipmentStatus, User, UserRole
from app.schemas.ai import (
    CopilotRequest,
    DelayQueueItem,
    DelayRiskResponse,
    EtaResponse,
    ForecastResponse,
    FraudRiskResponse,
    FraudSignals,
    RouteOptimizeRequest,
    ShipmentPredictionRequest,
)
from app.services.ai import copilot
from app.services.ai.route_optimizer import Stop, VehicleSpec, optimize_routes

router = APIRouter(prefix="/ai", tags=["ai"])

settings = get_settings()

AI_RATE_LIMIT = "60/minute"


def _pickup(body: ShipmentPredictionRequest) -> datetime:
    return body.pickup_at or datetime.now(UTC)


@router.get("/models")
async def models():
    """Model cards: held-out evaluation metrics for every model in production."""
    return predict.model_metrics()


@router.post("/eta", response_model=EtaResponse)
@limiter.limit(AI_RATE_LIMIT)
async def eta(request: Request, body: ShipmentPredictionRequest):
    try:
        return predict.predict_eta(
            body.origin_city, body.destination_city, body.shipment_type.value, body.weight_kg, _pickup(body)
        )
    except predict.UnknownLaneError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.post("/delay-risk", response_model=DelayRiskResponse)
@limiter.limit(AI_RATE_LIMIT)
async def delay_risk(request: Request, body: ShipmentPredictionRequest):
    try:
        return predict.predict_delay(
            body.origin_city, body.destination_city, body.shipment_type.value, body.weight_kg, _pickup(body)
        )
    except predict.UnknownLaneError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.post("/fraud-risk", response_model=FraudRiskResponse)
@limiter.limit(AI_RATE_LIMIT)
async def fraud_risk(request: Request, body: FraudSignals):
    signals = body.model_dump()
    for key in ("payment_cod", "address_mismatch", "night_booking", "new_lane_for_customer"):
        signals[key] = int(signals[key])
    return predict.predict_fraud(signals)


@router.get("/forecast/lanes")
async def forecast_lane_list():
    return {"lanes": predict.forecast_lanes()}


@router.get("/forecast", response_model=ForecastResponse)
@limiter.limit(AI_RATE_LIMIT)
async def forecast(request: Request, lane: str):
    try:
        return predict.forecast_demand(lane)
    except predict.UnknownLaneError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.post("/route-optimize")
@limiter.limit(AI_RATE_LIMIT)
async def route_optimize(request: Request, body: RouteOptimizeRequest):
    try:
        return optimize_routes(
            body.depot,
            [Stop(s.shipment_ref, s.city, s.load_kg) for s in body.stops],
            [VehicleSpec(v.name, v.capacity_kg) for v in body.vehicles],
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None


@router.post("/copilot")
@limiter.limit("30/minute")
async def ask_copilot(request: Request, body: CopilotRequest, db: AsyncSession = Depends(get_db)):
    return await copilot.ask(db, body.question)


@router.get("/copilot/suggestions")
async def copilot_suggestions():
    return {"suggestions": copilot.SUGGESTIONS}


@router.get("/insights/overview")
async def insights_overview(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    """Admin-only: headline numbers for the admin overview, straight from the DB."""
    from datetime import timedelta

    from sqlalchemy import func

    from app.models import Lead, Quote

    status_rows = (await db.execute(select(Shipment.status, func.count()).group_by(Shipment.status))).all()
    by_status = {s.value: c for s, c in status_rows}
    leads_30d = (
        await db.execute(
            select(func.count())
            .select_from(Lead)
            .where(Lead.created_at >= datetime.now(UTC) - timedelta(days=30))
        )
    ).scalar()
    quote_value, quote_count = (
        await db.execute(select(func.coalesce(func.sum(Quote.price_max), 0), func.count()).select_from(Quote))
    ).one()
    return {
        "shipments_total": sum(by_status.values()),
        "shipments_by_status": by_status,
        "active": sum(
            by_status.get(s, 0) for s in ("picked_up", "in_transit", "out_for_delivery", "delayed")
        ),
        "leads_last_30d": leads_30d,
        "quotes_count": quote_count,
        "quotes_value_max": float(quote_value),
    }


@router.get("/insights/fraud-queue")
async def fraud_queue(
    user: User = Depends(require_role(UserRole.admin)),
):
    """Admin-only: recent bookings scored by the fraud model, riskiest first.

    Until real booking volume exists, this scores a demo batch drawn from the
    synthetic booking stream (clearly labelled in the UI).
    """
    from app.ml.datagen import generate_bookings

    batch = generate_bookings(n=4000, seed=99).tail(300)
    items = []
    for i, (_, row) in enumerate(batch.iterrows()):
        signals = {
            "account_age_days": float(row["account_age_days"]),
            "bookings_last_24h": int(row["bookings_last_24h"]),
            "declared_value_inr": float(row["declared_value_inr"]),
            "weight_kg": float(row["weight_kg"]),
            "payment_cod": int(row["payment_cod"]),
            "address_mismatch": int(row["address_mismatch"]),
            "night_booking": int(row["night_booking"]),
            "claims_ratio": float(row["claims_ratio"]),
            "new_lane_for_customer": int(row["new_lane_for_customer"]),
        }
        r = predict.predict_fraud(signals)
        if r["risk_level"] == "low":
            continue
        items.append(
            {
                "booking_ref": f"BK-{7400 + i}",
                "fraud_probability": r["fraud_probability"],
                "risk_level": r["risk_level"],
                "declared_value_inr": signals["declared_value_inr"],
                "account_age_days": int(signals["account_age_days"]),
                "top_reason": r["reasons"][0]["label"] if r["reasons"] else None,
            }
        )
    items.sort(key=lambda x: -x["fraud_probability"])
    return {"items": items[:8], "scored": len(batch), "source": "demo bookings (synthetic)"}


@router.get("/insights/delay-queue", response_model=list[DelayQueueItem])
async def delay_queue(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    """Admin-only: every active shipment scored by the delay model, riskiest first."""
    active = (
        (
            await db.execute(
                select(Shipment).where(
                    Shipment.status.in_(
                        [
                            ShipmentStatus.picked_up,
                            ShipmentStatus.in_transit,
                            ShipmentStatus.out_for_delivery,
                            ShipmentStatus.delayed,
                        ]
                    )
                )
            )
        )
        .scalars()
        .all()
    )
    now = datetime.now(UTC)
    items: list[DelayQueueItem] = []
    for s in active:
        try:
            r = predict.predict_delay(
                s.origin_city, s.destination_city, s.shipment_type.value, s.weight_kg or 500, now
            )
        except predict.UnknownLaneError:
            continue
        items.append(
            DelayQueueItem(
                tracking_id=s.tracking_id,
                lane=f"{s.origin_city} → {s.destination_city}",
                status=s.status.value,
                delay_probability=r["delay_probability"],
                risk_level=r["risk_level"],
                top_factor=r["factors"][0]["label"] if r["factors"] else None,
            )
        )
    items.sort(key=lambda i: -i.delay_probability)
    return items
