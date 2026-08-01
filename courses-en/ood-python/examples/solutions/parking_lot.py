from dataclasses import dataclass
from enum import Enum


class VehicleType(Enum):
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    BUS = "bus"


@dataclass
class Spot:
    id: int
    vehicle_type: VehicleType
    occupied_by: str | None = None


class ParkingLot:
    """MVP: motorcycle/car use matching spots; bus uses one car spot."""

    def __init__(self, motorcycle_spots: int, car_spots: int, bus_spots: int):
        self._spots: dict[int, Spot] = {}
        next_id = 1
        for _ in range(motorcycle_spots):
            self._spots[next_id] = Spot(next_id, VehicleType.MOTORCYCLE)
            next_id += 1
        for _ in range(car_spots):
            self._spots[next_id] = Spot(next_id, VehicleType.CAR)
            next_id += 1
        for _ in range(bus_spots):
            self._spots[next_id] = Spot(next_id, VehicleType.BUS)
            next_id += 1

    def _spot_type_for(self, vehicle_type: VehicleType) -> VehicleType:
        if vehicle_type == VehicleType.BUS:
            return VehicleType.CAR
        return vehicle_type

    def park(self, vehicle_type: VehicleType, plate: str) -> int | None:
        needed = self._spot_type_for(vehicle_type)
        for spot in self._spots.values():
            if spot.vehicle_type == needed and spot.occupied_by is None:
                spot.occupied_by = plate
                return spot.id
        return None

    def leave(self, spot_id: int) -> bool:
        spot = self._spots.get(spot_id)
        if not spot or spot.occupied_by is None:
            return False
        spot.occupied_by = None
        return True
