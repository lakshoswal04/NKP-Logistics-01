from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.limiter import limiter
from app.db import get_db
from app.models import Shipment
from app.schemas.tracking import TrackingOut

router = APIRouter(prefix="/tracking", tags=["tracking"])

settings = get_settings()


@router.get("/{tracking_id}", response_model=TrackingOut)
@limiter.limit(settings.tracking_rate_limit)
async def track_shipment(request: Request, tracking_id: str, db: AsyncSession = Depends(get_db)):
    shipment = await db.scalar(
        select(Shipment)
        .options(selectinload(Shipment.events))
        .where(Shipment.tracking_id == tracking_id.strip().upper())
    )
    if shipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No shipment found for this tracking ID")
    return shipment
