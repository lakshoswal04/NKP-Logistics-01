from datetime import datetime

from pydantic import BaseModel

from app.models import ShipmentStatus, ShipmentType


class TrackingEventOut(BaseModel):
    status: ShipmentStatus
    description: str | None
    location: str | None
    lat: float | None
    lng: float | None
    occurred_at: datetime

    model_config = {"from_attributes": True}


class TrackingOut(BaseModel):
    """Public tracking payload. Deliberately excludes driver phone and company details."""

    tracking_id: str
    status: ShipmentStatus
    shipment_type: ShipmentType
    origin_city: str
    destination_city: str
    pickup_date: datetime | None
    eta: datetime | None
    vehicle_type: str | None
    driver_name: str | None
    events: list[TrackingEventOut]

    model_config = {"from_attributes": True}
