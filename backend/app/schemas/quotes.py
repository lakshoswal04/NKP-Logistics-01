from pydantic import BaseModel, Field

from app.models import ShipmentType, Urgency


class QuoteRequest(BaseModel):
    origin_city: str = Field(min_length=2, max_length=100)
    destination_city: str = Field(min_length=2, max_length=100)
    weight_kg: float = Field(gt=0, le=50000)
    shipment_type: ShipmentType = ShipmentType.ltl
    urgency: Urgency = Urgency.standard


class QuoteOut(BaseModel):
    origin_city: str
    destination_city: str
    distance_km: float
    weight_kg: float
    shipment_type: ShipmentType
    urgency: Urgency
    price_min: float
    price_max: float
    currency: str = "INR"
    disclaimer: str = (
        "AI-estimated indicative range, not a binding quote. "
        "Our team will confirm final pricing."
    )
