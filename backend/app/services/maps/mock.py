import math

from app.services.maps.base import DistanceProvider
from app.services.maps.cities import CITY_COORDS

# Straight-line to road-distance correction for Indian highways
ROAD_FACTOR = 1.25


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lng1 = map(math.radians, a)
    lat2, lng2 = map(math.radians, b)
    dlat, dlng = lat2 - lat1, lng2 - lng1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(h))


class MockDistanceProvider(DistanceProvider):
    """Haversine distance between known city coordinates with a road-factor correction.

    Zero-dependency stand-in for the Google Distance Matrix API.
    """

    async def distance_km(self, origin_city: str, destination_city: str) -> float | None:
        origin = CITY_COORDS.get(origin_city.strip().lower())
        destination = CITY_COORDS.get(destination_city.strip().lower())
        if origin is None or destination is None:
            return None
        if origin == destination:
            return 25.0  # intra-city average haul
        return round(haversine_km(origin, destination) * ROAD_FACTOR, 1)
