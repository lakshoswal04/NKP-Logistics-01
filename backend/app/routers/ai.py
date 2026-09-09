"""AI Control Tower endpoints.

Every feature has two paths: model-backed when a Gemini key is configured, and a
deterministic path that runs the same tools against the same data when it is
not. Responses carry `mode` so the UI can label which one produced them — a page
that looks identical either way would be dishonest.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.db import get_db
from app.models import Shipment, ShipmentStatus, User
from app.schemas.ai import (
    AddressRequest,
    AddressResponse,
    AiStatus,
    CopilotRequest,
    CopilotResponse,
    DelayNarrativeRequest,
    DelayNarrativeResponse,
    PlacementRequest,
    PlacementResponse,
    TriageRequest,
    TriageResponse,
)
from app.services.ai import demo, prompts
from app.services.ai.gemini import GeminiError, get_gemini
from app.services.ai.tools import TOOL_DECLARATIONS, make_executor

logger = logging.getLogger("nkp.ai")
settings = get_settings()
router = APIRouter(prefix="/ai", tags=["ai"])

FEATURES = [
    "Ops copilot with live tool access",
    "Address intelligence and RTO risk",
    "Fulfilment-centre placement",
    "Support triage",
    "Delay narrative and customer email",
]


@router.get("/status", response_model=AiStatus)
async def ai_status():
    gemini = get_gemini()
    return AiStatus(
        mode="live" if gemini.is_live else "demo",
        model=gemini.model if gemini.is_live else None,
        features=FEATURES,
        suggestions=demo.SUGGESTIONS,
        note=(
            f"Model-backed responses via {gemini.model}."
            if gemini.is_live
            else "No Gemini key configured. Every figure below is still read live from your "
            "data — answers are composed by rules rather than by a model."
        ),
    )


@router.post("/copilot", response_model=CopilotResponse)
@limiter.limit(settings.ai_rate_limit)
async def copilot(
    request: Request,
    body: CopilotRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    gemini = get_gemini()
    if not gemini.is_live:
        result = await demo.answer(db, user, body.question)
        return CopilotResponse(
            answer=result["text"], mode="demo", tools_used=result["tools_used"], data=result.get("data")
        )

    try:
        result = await gemini.run_with_tools(
            instruction=prompts.COPILOT,
            prompt=body.question,
            tools=TOOL_DECLARATIONS,
            executor=make_executor(db, user),
        )
    except GeminiError as exc:
        # Falling back keeps the feature usable when the provider is down, and
        # the mode field tells the user which path answered.
        logger.warning("Copilot fell back to demo mode: %s", exc)
        fallback = await demo.answer(db, user, body.question)
        return CopilotResponse(
            answer=fallback["text"],
            mode="demo",
            tools_used=fallback["tools_used"],
            data=fallback.get("data"),
        )

    return CopilotResponse(
        answer=result.text, mode="live", model=result.model, tools_used=result.tools_used
    )


@router.post("/copilot/stream")
@limiter.limit(settings.ai_rate_limit)
async def copilot_stream(
    request: Request,
    body: CopilotRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Server-sent events so the answer appears as it is produced."""
    gemini = get_gemini()

    async def events():
        def frame(payload: dict) -> str:
            return f"data: {json.dumps(payload)}\n\n"

        try:
            if not gemini.is_live:
                result = await demo.answer(db, user, body.question)
                yield frame({"type": "meta", "mode": "demo", "tools_used": result["tools_used"]})
                # Chunked so the client renders progressively on both paths and
                # needs only one code path for display.
                text = result["text"]
                for i in range(0, len(text), 90):
                    yield frame({"type": "text", "value": text[i : i + 90]})
                yield frame({"type": "done", "mode": "demo"})
                return

            executor = make_executor(db, user)
            result = await gemini.run_with_tools(
                instruction=prompts.COPILOT,
                prompt=body.question,
                tools=TOOL_DECLARATIONS,
                executor=executor,
            )
            yield frame({"type": "meta", "mode": "live", "tools_used": result.tools_used,
                         "model": result.model})
            for i in range(0, len(result.text), 90):
                yield frame({"type": "text", "value": result.text[i : i + 90]})
            yield frame({"type": "done", "mode": "live", "model": result.model})
        except Exception as exc:  # noqa: BLE001
            logger.exception("Copilot stream failed")
            yield frame({"type": "error", "message": str(exc)[:200]})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # nginx would otherwise buffer the whole stream
            "Connection": "keep-alive",
        },
    )


@router.post("/address", response_model=AddressResponse)
@limiter.limit(settings.ai_rate_limit)
async def address_intelligence(request: Request, body: AddressRequest):
    gemini = get_gemini()
    baseline = demo.address_intelligence(body.address)

    if not gemini.is_live:
        return AddressResponse(**baseline, mode="demo")

    try:
        result = await gemini.generate(
            instruction=prompts.ADDRESS,
            prompt=f"Raw address:\n{body.address}",
            schema=AddressResponse,
            temperature=0.1,
        )
        payload = dict(result.data or {})
        payload.pop("mode", None)
        payload.pop("model", None)
        payload.pop("disclaimer", None)
        return AddressResponse(**payload, mode="live", model=result.model)
    except (GeminiError, TypeError, ValueError) as exc:
        logger.warning("Address intelligence fell back: %s", exc)
        return AddressResponse(**baseline, mode="demo")


@router.post("/placement", response_model=PlacementResponse)
@limiter.limit(settings.ai_rate_limit)
async def placement(request: Request, body: PlacementRequest):
    gemini = get_gemini()
    baseline = demo.placement_advice([row.model_dump() for row in body.distribution])
    if "error" in baseline:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, baseline["error"])

    if not gemini.is_live:
        return PlacementResponse(**baseline, mode="demo")

    try:
        prompt = (
            "Monthly order distribution by city:\n"
            + "\n".join(f"- {row.city}: {row.orders} orders" for row in body.distribution)
            + (f"\n\nCustomer notes: {body.notes}" if body.notes else "")
            + "\n\nA rules-based allocation for reference:\n"
            + json.dumps(baseline, indent=2)
        )
        result = await gemini.generate(
            instruction=prompts.PLACEMENT, prompt=prompt, schema=PlacementResponse, temperature=0.3
        )
        payload = dict(result.data or {})
        for key in ("mode", "model", "disclaimer"):
            payload.pop(key, None)
        return PlacementResponse(**payload, mode="live", model=result.model)
    except (GeminiError, TypeError, ValueError) as exc:
        logger.warning("Placement fell back: %s", exc)
        return PlacementResponse(**baseline, mode="demo")


@router.post("/triage", response_model=TriageResponse)
@limiter.limit(settings.ai_rate_limit)
async def triage(request: Request, body: TriageRequest):
    from app.services.ai.knowledge import baseline_triage, retrieve

    gemini = get_gemini()
    matches = retrieve(body.message, limit=3)
    baseline = baseline_triage(body.message, matches)

    if not gemini.is_live:
        return TriageResponse(**baseline, mode="demo")

    try:
        excerpts = "\n\n".join(f"Q: {m['q']}\nA: {m['a']}" for m in matches) or "(no close match)"
        result = await gemini.generate(
            instruction=prompts.TRIAGE,
            prompt=f"Customer message:\n{body.message}\n\nKnowledge base excerpts:\n{excerpts}",
            schema=TriageResponse,
            temperature=0.2,
        )
        payload = dict(result.data or {})
        for key in ("mode", "model", "disclaimer"):
            payload.pop(key, None)
        payload.setdefault("matched_topics", [m["q"] for m in matches])
        return TriageResponse(**payload, mode="live", model=result.model)
    except (GeminiError, TypeError, ValueError) as exc:
        logger.warning("Triage fell back: %s", exc)
        return TriageResponse(**baseline, mode="demo")


@router.post("/delay-narrative", response_model=DelayNarrativeResponse)
@limiter.limit(settings.ai_rate_limit)
async def delay_narrative(
    request: Request,
    body: DelayNarrativeRequest,
    db: AsyncSession = Depends(get_db),
):
    shipment = (
        await db.execute(
            select(Shipment)
            .options(selectinload(Shipment.events))
            .where(Shipment.tracking_id == body.tracking_id.strip().upper())
        )
    ).scalar_one_or_none()
    if shipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No consignment with that reference")

    from app.services.ai.knowledge import baseline_narrative

    scans = sorted(shipment.events, key=lambda e: e.occurred_at)
    baseline = baseline_narrative(shipment, scans)

    gemini = get_gemini()
    if not gemini.is_live:
        return DelayNarrativeResponse(**baseline, mode="demo")

    try:
        history = "\n".join(
            f"- {e.occurred_at:%d %b %H:%M} · {e.status.value} · {e.description or ''}"
            f" · {e.location or 'en route'}"
            for e in scans
        )
        prompt = (
            f"Consignment {shipment.tracking_id}, {shipment.origin_city} to "
            f"{shipment.destination_city}, currently {shipment.status.value}.\n"
            f"Expected: {shipment.eta:%d %b %H:%M}\n" if shipment.eta else ""
        ) + f"Scan history:\n{history}"
        result = await gemini.generate(
            instruction=prompts.DELAY_NARRATIVE,
            prompt=prompt,
            schema=DelayNarrativeResponse,
            temperature=0.4,
        )
        payload = dict(result.data or {})
        for key in ("mode", "model", "disclaimer"):
            payload.pop(key, None)
        payload["tracking_id"] = shipment.tracking_id
        payload["status"] = shipment.status.value
        return DelayNarrativeResponse(**payload, mode="live", model=result.model)
    except (GeminiError, TypeError, ValueError) as exc:
        logger.warning("Delay narrative fell back: %s", exc)
        return DelayNarrativeResponse(**baseline, mode="demo")


@router.get("/delayed-consignments")
async def delayed_consignments(db: AsyncSession = Depends(get_db)):
    """References the delay-narrative demo can be run against."""
    rows = (
        await db.execute(
            select(Shipment)
            .where(Shipment.status.in_([ShipmentStatus.delayed, ShipmentStatus.failed,
                                        ShipmentStatus.in_transit]))
            .order_by(Shipment.status)
            .limit(8)
        )
    ).scalars().all()
    return {
        "consignments": [
            {
                "tracking_id": s.tracking_id,
                "status": s.status.value,
                "lane": f"{s.origin_city} → {s.destination_city}",
            }
            for s in rows
        ]
    }
