from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import get_settings
from app.core.limiter import limiter
from app.schemas.quotes import QuoteOut, QuoteRequest
from app.services.ai.quote import UnknownCityError, estimate_quote

router = APIRouter(prefix="/quotes", tags=["quotes"])

settings = get_settings()


@router.post("/estimate", response_model=QuoteOut)
@limiter.limit(settings.leads_rate_limit)
async def estimate(request: Request, body: QuoteRequest):
    try:
        result = await estimate_quote(
            body.origin_city, body.destination_city, body.weight_kg, body.shipment_type, body.urgency
        )
    except UnknownCityError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "We couldn't estimate this lane automatically — our team will quote it manually.",
        ) from None
    return QuoteOut(**result.__dict__)
