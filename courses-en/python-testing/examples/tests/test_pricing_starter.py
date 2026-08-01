# Starter tests — extend in labs
from decimal import Decimal

from shop.pricing import apply_discount


def test_apply_discount_no_change():
    assert apply_discount(Decimal("100.00"), 0) == Decimal("100.00")
