"""Rules-based indicative quote engine (AI Quote Generator v1).

price = base_fee + distance_km * per_km + weight_kg * per_kg, times an urgency
multiplier, returned as a ±10% indicative range. Replace with a trained
regression model once historical pricing data exists (PRD §5).
"""

from dataclasses import dataclass

from app.models import ShipmentType, Urgency
from app.services.maps import get_distance_provider

# base_fee (₹), per_km (₹/km), per_kg (₹/kg)
RATE_CARD: dict[ShipmentType, tuple[float, float, float]] = {
    ShipmentType.ftl: (5000.0, 45.0, 0.0),
    ShipmentType.ltl: (1500.0, 18.0, 2.5),
    ShipmentType.express: (2500.0, 30.0, 4.0),
    ShipmentType.last_mile: (800.0, 12.0, 3.0),
}

URGENCY_MULTIPLIER: dict[Urgency, float] = {
    Urgency.standard: 1.0,
    Urgency.urgent: 1.25,
}

RANGE_SPREAD = 0.10


@dataclass
class QuoteEstimate:
    origin_city: str
    destination_city: str
    distance_km: float
    weight_kg: float
    shipment_type: ShipmentType
    urgency: Urgency
    price_min: float
    price_max: float
    currency: str = "INR"


class UnknownCityError(ValueError):
    pass


def compute_price(
    distance_km: float, weight_kg: float, shipment_type: ShipmentType, urgency: Urgency
) -> float:
    base_fee, per_km, per_kg = RATE_CARD[shipment_type]
    price = base_fee + distance_km * per_km + weight_kg * per_kg
    return price * URGENCY_MULTIPLIER[urgency]


async def estimate_quote(
    origin_city: str,
    destination_city: str,
    weight_kg: float,
    shipment_type: ShipmentType,
    urgency: Urgency = Urgency.standard,
) -> QuoteEstimate:
    distance = await get_distance_provider().distance_km(origin_city, destination_city)
    if distance is None:
        raise UnknownCityError(f"Unknown city in lane {origin_city!r} → {destination_city!r}")
    price = compute_price(distance, weight_kg, shipment_type, urgency)
    return QuoteEstimate(
        origin_city=origin_city.strip().title(),
        destination_city=destination_city.strip().title(),
        distance_km=distance,
        weight_kg=weight_kg,
        shipment_type=shipment_type,
        urgency=urgency,
        price_min=round(price * (1 - RANGE_SPREAD), -1),
        price_max=round(price * (1 + RANGE_SPREAD), -1),
    )
