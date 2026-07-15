from abc import ABC, abstractmethod


class DistanceProvider(ABC):
    """Road distance between two Indian cities, in km."""

    @abstractmethod
    async def distance_km(self, origin_city: str, destination_city: str) -> float | None:
        """Return the road distance, or None if either city is unknown."""
