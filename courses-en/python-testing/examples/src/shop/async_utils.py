"""Async helper — for pytest-asyncio labs."""
import asyncio
from decimal import Decimal

from shop.pricing import apply_discount


async def async_discounted_total(prices: list[Decimal], percent: int) -> Decimal:
    total = Decimal("0")
    for price in prices:
        await asyncio.sleep(0)  # yield to event loop
        total += apply_discount(price, percent)
    return total
