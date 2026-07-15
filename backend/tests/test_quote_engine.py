import pytest

from app.models import ShipmentType, Urgency
from app.services.ai.quote import RATE_CARD, UnknownCityError, compute_price, estimate_quote
from app.services.maps.mock import MockDistanceProvider, haversine_km


async def test_mock_distance_known_lane():
    provider = MockDistanceProvider()
    distance = await provider.distance_km("Mumbai", "Delhi")
    # ~1150 km straight-line * 1.25 road factor ≈ 1440 km
    assert distance is not None
    assert 1300 < distance < 1600


async def test_mock_distance_unknown_city():
    provider = MockDistanceProvider()
    assert await provider.distance_km("Mumbai", "Atlantis") is None


async def test_mock_distance_same_city():
    provider = MockDistanceProvider()
    assert await provider.distance_km("pune", "Pune") == 25.0


def test_haversine_zero_for_same_point():
    assert haversine_km((19.0, 72.0), (19.0, 72.0)) == 0


def test_compute_price_ltl():
    base, per_km, per_kg = RATE_CARD[ShipmentType.ltl]
    expected = base + 1000 * per_km + 500 * per_kg
    assert compute_price(1000, 500, ShipmentType.ltl, Urgency.standard) == expected


def test_urgent_multiplier():
    standard = compute_price(800, 200, ShipmentType.express, Urgency.standard)
    urgent = compute_price(800, 200, ShipmentType.express, Urgency.urgent)
    assert urgent == pytest.approx(standard * 1.25)


async def test_estimate_quote_range_and_titlecase():
    result = await estimate_quote("mumbai", "pune", 300, ShipmentType.ltl)
    assert result.origin_city == "Mumbai"
    assert result.price_min < result.price_max
    assert result.currency == "INR"


async def test_estimate_quote_unknown_city_raises():
    with pytest.raises(UnknownCityError):
        await estimate_quote("mumbai", "gotham", 300, ShipmentType.ltl)
