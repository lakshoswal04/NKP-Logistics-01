"""Operations Copilot — natural-language Q&A over the platform's own data.

v1 is an intent parser dispatching to read-only SQLAlchemy queries plus the
ML layer. It answers genuinely from live data; an LLM provider (Claude) can
replace the parser behind this same interface once an API key is configured.
Strictly read-only by design (PRD §5 guardrail).
"""

import re
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml import predict
from app.models import Lead, Quote, Shipment, ShipmentStatus

SUGGESTIONS = [
    "How many shipments are in transit right now?",
    "Which shipments are delayed?",
    "What's the delay risk on our active shipments?",
    "Forecast demand for Mumbai → Delhi",
    "How many leads did we get this month?",
    "What's our total quoted value?",
]


def _fmt_lane(s: Shipment) -> str:
    return f"{s.origin_city} → {s.destination_city}"


async def _status_counts(db: AsyncSession) -> dict[str, int]:
    rows = (await db.execute(select(Shipment.status, func.count()).group_by(Shipment.status))).all()
    return {status.value: count for status, count in rows}


async def _answer_status(db: AsyncSession, question: str) -> dict:
    counts = await _status_counts(db)
    total = sum(counts.values())
    wanted = None
    for status in ShipmentStatus:
        if status.value.replace("_", " ") in question or status.value in question:
            wanted = status.value
            break
    if wanted:
        n = counts.get(wanted, 0)
        return {
            "answer": f"{n} of {total} shipments are currently {wanted.replace('_', ' ')}.",
            "chart": {
                "type": "bar",
                "series": [{"label": k.replace("_", " "), "value": v} for k, v in counts.items()],
            },
        }
    return {
        "answer": f"You have {total} shipments on the network: "
        + ", ".join(
            f"{v} {k.replace('_', ' ')}" for k, v in sorted(counts.items(), key=lambda x: -x[1])
        )
        + ".",
        "chart": {
            "type": "bar",
            "series": [{"label": k.replace("_", " "), "value": v} for k, v in counts.items()],
        },
    }


async def _answer_delayed(db: AsyncSession) -> dict:
    rows = (
        await db.execute(
            select(Shipment).where(Shipment.status.in_([ShipmentStatus.delayed, ShipmentStatus.failed]))
        )
    ).scalars().all()
    if not rows:
        return {"answer": "No shipments are currently delayed or failed. All lanes are running to plan."}
    lines = [f"{s.tracking_id} ({_fmt_lane(s)}) — {s.status.value.replace('_', ' ')}" for s in rows]
    return {
        "answer": f"{len(rows)} shipment(s) need attention:",
        "data": [
            {
                "tracking_id": s.tracking_id,
                "lane": _fmt_lane(s),
                "status": s.status.value,
                "driver": s.driver_name,
            }
            for s in rows
        ],
        "detail": lines,
    }


async def _answer_delay_risk(db: AsyncSession) -> dict:
    active = (
        (
            await db.execute(
                select(Shipment).where(
                    Shipment.status.in_(
                        [ShipmentStatus.picked_up, ShipmentStatus.in_transit, ShipmentStatus.out_for_delivery]
                    )
                )
            )
        )
        .scalars()
        .all()
    )
    now = datetime.now(UTC)
    scored = []
    for s in active:
        try:
            r = predict.predict_delay(
                s.origin_city, s.destination_city, s.shipment_type.value, s.weight_kg or 500, now
            )
        except predict.UnknownLaneError:
            continue
        scored.append(
            {
                "tracking_id": s.tracking_id,
                "lane": _fmt_lane(s),
                "delay_probability": r["delay_probability"],
                "risk_level": r["risk_level"],
                "top_factor": r["factors"][0]["label"] if r["factors"] else None,
            }
        )
    scored.sort(key=lambda x: -x["delay_probability"])
    high = [s for s in scored if s["risk_level"] != "low"]
    answer = (
        f"Scored {len(scored)} active shipments with the delay model: "
        f"{len(high)} carry elevated risk."
        if scored
        else "No active shipments to score right now."
    )
    return {"answer": answer, "data": scored[:8]}


async def _answer_leads(db: AsyncSession, question: str) -> dict:
    since = datetime.now(UTC) - timedelta(days=30 if "month" in question else 7)
    n = (await db.execute(select(func.count()).select_from(Lead).where(Lead.created_at >= since))).scalar()
    period = "30 days" if "month" in question else "7 days"
    return {"answer": f"{n} lead(s) came in over the last {period}."}


async def _answer_quotes(db: AsyncSession) -> dict:
    total, count = (
        await db.execute(select(func.coalesce(func.sum(Quote.price_max), 0), func.count()).select_from(Quote))
    ).one()
    return {
        "answer": f"{count} AI quote(s) generated so far, "
        f"worth up to ₹{int(total):,} at the top of the range."
    }


def _answer_forecast(question: str) -> dict:
    lanes = predict.forecast_lanes()
    match = None
    for lane in lanes:
        o, d = [p.strip().lower() for p in lane.split("→")]
        if o in question and d in question:
            match = lane
            break
    if match is None:
        return {
            "answer": "I can forecast these lanes: "
            + ", ".join(lanes)
            + ". Name one, e.g. 'forecast Mumbai → Delhi'.",
        }
    f = predict.forecast_demand(match, horizon_days=14)
    avg = sum(p["volume"] for p in f["forecast"]) / len(f["forecast"])
    return {
        "answer": f"Expected volume on {match}: about {avg:.0f} shipments/day over the next 14 days "
        f"(model MAPE {predict.model_metrics()['forecast']['mape_mean']:.0%}).",
        "chart": {
            "type": "line",
            "series": [{"label": p["date"], "value": p["volume"]} for p in f["forecast"]],
        },
    }


INTENTS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(delay risk|at risk|risk)\b"), "delay_risk"),
    (re.compile(r"\b(delayed|late|failed|attention|exception)\b"), "delayed"),
    (re.compile(r"\b(forecast|demand|volume next|expect)\b"), "forecast"),
    (re.compile(r"\b(lead|enquir|inquir)\b"), "leads"),
    (re.compile(r"\b(quote|revenue|value|worth)\b"), "quotes"),
    (re.compile(r"\b(shipment|in transit|delivered|status|booked|network|how many)\b"), "status"),
]


async def ask(db: AsyncSession, question: str) -> dict:
    q = question.strip().lower()
    intent = next((name for pattern, name in INTENTS if pattern.search(q)), None)

    if intent == "status":
        result = await _answer_status(db, q)
    elif intent == "delayed":
        result = await _answer_delayed(db)
    elif intent == "delay_risk":
        result = await _answer_delay_risk(db)
    elif intent == "forecast":
        result = _answer_forecast(q)
    elif intent == "leads":
        result = await _answer_leads(db, q)
    elif intent == "quotes":
        result = await _answer_quotes(db)
    else:
        result = {
            "answer": "I can answer questions about shipment status, delays, delay risk, "
            "demand forecasts, leads and quotes. Try one of the suggestions.",
            "suggestions": SUGGESTIONS,
        }
    result.setdefault("suggestions", [])
    return result
