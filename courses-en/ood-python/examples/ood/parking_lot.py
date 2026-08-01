"""Chapter 10 — Parking lot simplified."""

from enum import Enum


class VehicleType(Enum):
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    BUS = "bus"


class ParkingLot:
    def __init__(self, motorcycle_spots: int, car_spots: int, bus_spots: int):
        raise NotImplementedError

    def park(self, vehicle_type: VehicleType, plate: str) -> int | None:
        """Return spot id or None if full."""
        raise NotImplementedError

    def leave(self, spot_id: int) -> bool:
        raise NotImplementedError
