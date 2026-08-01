import time

import pytest

from ood.lru_cache import LRUCache
from ood.parking_lot import ParkingLot, VehicleType
from ood.rate_limiter import TokenBucketLimiter


def test_lru_basic():
    c = LRUCache(2)
    c.put(1, 1)
    c.put(2, 2)
    assert c.get(1) == 1
    c.put(3, 3)
    assert c.get(2) == -1
    c.put(4, 4)
    assert c.get(1) == -1
    assert c.get(3) == 3
    assert c.get(4) == 4


def test_lru_update_existing():
    c = LRUCache(2)
    c.put(1, 1)
    c.put(1, 10)
    assert c.get(1) == 10


def test_token_bucket():
    lim = TokenBucketLimiter(rate=10, capacity=2)
    assert lim.allow() is True
    assert lim.allow() is True
    assert lim.allow() is False
    time.sleep(0.25)
    assert lim.allow() is True


def test_parking_lot():
    lot = ParkingLot(motorcycle_spots=2, car_spots=1, bus_spots=1)
    s1 = lot.park(VehicleType.MOTORCYCLE, "M1")
    s2 = lot.park(VehicleType.CAR, "C1")
    assert s1 is not None and s2 is not None
    assert lot.park(VehicleType.BUS, "B1") is None
    assert lot.leave(s2) is True
    assert lot.park(VehicleType.BUS, "B1") is not None
