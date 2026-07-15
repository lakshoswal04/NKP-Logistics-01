from pydantic import BaseModel, EmailStr, Field

from app.models import LeadStatus, ShipmentType, Urgency
from app.schemas.quotes import QuoteOut


class LeadCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    company_name: str | None = Field(default=None, max_length=255)
    message: str | None = Field(default=None, max_length=5000)
    service: str | None = Field(default=None, max_length=100)
    industry: str | None = Field(default=None, max_length=100)

    # Optional shipment parameters — when provided, an indicative AI quote is returned
    origin_city: str | None = Field(default=None, max_length=100)
    destination_city: str | None = Field(default=None, max_length=100)
    weight_kg: float | None = Field(default=None, gt=0, le=50000)
    shipment_type: ShipmentType = ShipmentType.ltl
    urgency: Urgency = Urgency.standard


class LeadOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    status: LeadStatus
    quote: QuoteOut | None = None

    model_config = {"from_attributes": True}
