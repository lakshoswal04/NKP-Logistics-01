import logging

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.limiter import limiter
from app.db import get_db
from app.models import Lead, Quote
from app.schemas.leads import LeadCreate, LeadOut
from app.schemas.quotes import QuoteOut
from app.services.ai.quote import UnknownCityError, estimate_quote
from app.services.email import get_email_provider

logger = logging.getLogger("nkp.leads")

router = APIRouter(prefix="/leads", tags=["leads"])

settings = get_settings()


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.leads_rate_limit)
async def create_lead(request: Request, body: LeadCreate, db: AsyncSession = Depends(get_db)):
    lead = Lead(
        full_name=body.full_name,
        email=body.email.lower(),
        phone=body.phone,
        company_name=body.company_name,
        message=body.message,
        service=body.service,
        industry=body.industry,
    )
    db.add(lead)
    await db.flush()

    quote_out: QuoteOut | None = None
    if body.origin_city and body.destination_city and body.weight_kg:
        try:
            estimate = await estimate_quote(
                body.origin_city,
                body.destination_city,
                body.weight_kg,
                body.shipment_type,
                body.urgency,
            )
            db.add(
                Quote(
                    origin_city=estimate.origin_city,
                    destination_city=estimate.destination_city,
                    distance_km=estimate.distance_km,
                    weight_kg=estimate.weight_kg,
                    shipment_type=estimate.shipment_type,
                    urgency=estimate.urgency,
                    price_min=estimate.price_min,
                    price_max=estimate.price_max,
                    lead_id=lead.id,
                )
            )
            quote_out = QuoteOut(**estimate.__dict__)
        except UnknownCityError:
            logger.info("Lead %s lane not quotable automatically; sales will quote manually", lead.id)

    await db.commit()

    email = get_email_provider()
    await email.send(
        to=settings.sales_notification_email,
        subject=f"New lead: {lead.full_name}" + (f" ({lead.company_name})" if lead.company_name else ""),
        body=f"Service: {lead.service or '-'} | Industry: {lead.industry or '-'}\n{lead.message or ''}",
    )
    await email.send(
        to=lead.email,
        subject="We received your enquiry — NKP Logistics",
        body="Thanks for reaching out. Our team will get back to you within one business day.",
    )

    return LeadOut(
        id=lead.id, full_name=lead.full_name, email=lead.email, status=lead.status, quote=quote_out
    )
