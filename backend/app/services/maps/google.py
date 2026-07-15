from app.services.maps.base import DistanceProvider


class GoogleDistanceProvider(DistanceProvider):
    """Google Distance Matrix implementation. Activated once GOOGLE_MAPS_API_KEY is set.

    TODO(iteration 2): implement via httpx against the Distance Matrix API with
    retry/backoff; keep MockDistanceProvider as the automatic fallback on errors.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def distance_km(self, origin_city: str, destination_city: str) -> float | None:
        raise NotImplementedError("Google Distance Matrix integration lands with real API keys")
