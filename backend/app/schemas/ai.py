from datetime import datetime

from pydantic import BaseModel, Field

from app.models import ShipmentType

DISCLAIMER = "AI estimate for decision support — not ground truth. A human confirms every action."


class ShipmentPredictionRequest(BaseModel):
    origin_city: str = Field(min_length=2, max_length=100)
    destination_city: str = Field(min_length=2, max_length=100)
    shipment_type: ShipmentType = ShipmentType.ltl
    weight_kg: float = Field(default=500, gt=0, le=50000)
    pickup_at: datetime | None = None


class EtaResponse(BaseModel):
    predicted_hours: float
    window_low_hours: float
    window_high_hours: float
    planned_hours: float
    distance_km: float
    disclaimer: str = DISCLAIMER


class Factor(BaseModel):
    label: str
    impact: float


class DelayRiskResponse(BaseModel):
    delay_probability: float
    risk_level: str
    factors: list[Factor]
    disclaimer: str = DISCLAIMER


class FraudSignals(BaseModel):
    account_age_days: float = Field(ge=0, le=5000)
    bookings_last_24h: int = Field(ge=0, le=50)
    declared_value_inr: float = Field(gt=0, le=10_000_000)
    weight_kg: float = Field(gt=0, le=50000)
    payment_cod: bool = False
    address_mismatch: bool = False
    night_booking: bool = False
    claims_ratio: float = Field(default=0.0, ge=0, le=1)
    new_lane_for_customer: bool = False


class FraudRiskResponse(BaseModel):
    fraud_probability: float
    risk_level: str
    reasons: list[Factor]
    disclaimer: str = DISCLAIMER


class ForecastPoint(BaseModel):
    date: str
    volume: float
    low: float | None = None
    high: float | None = None


class ForecastResponse(BaseModel):
    lane: str
    history: list[ForecastPoint]
    forecast: list[ForecastPoint]
    disclaimer: str = DISCLAIMER


class RouteStopIn(BaseModel):
    shipment_ref: str = Field(max_length=40)
    city: str = Field(min_length=2, max_length=100)
    load_kg: float = Field(gt=0, le=30000)


class VehicleIn(BaseModel):
    name: str = Field(max_length=60)
    capacity_kg: float = Field(gt=0, le=40000)


class RouteOptimizeRequest(BaseModel):
    depot: str = Field(min_length=2, max_length=100)
    stops: list[RouteStopIn] = Field(min_length=1, max_length=25)
    vehicles: list[VehicleIn] = Field(min_length=1, max_length=8)


class CopilotRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class DelayQueueItem(BaseModel):
    tracking_id: str
    lane: str
    status: str
    delay_probability: float
    risk_level: str
    top_factor: str | None
