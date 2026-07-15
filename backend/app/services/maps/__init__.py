from app.core.config import get_settings
from app.services.maps.base import DistanceProvider
from app.services.maps.mock import MockDistanceProvider


def get_distance_provider() -> DistanceProvider:
    settings = get_settings()
    if settings.google_maps_api_key:
        # Switch to GoogleDistanceProvider once implemented (iteration 2)
        pass
    return MockDistanceProvider()
