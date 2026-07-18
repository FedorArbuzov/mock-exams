"""Pricing rules — pure functions, easy to unit test."""
from decimal import Decimal, ROUND_HALF_UP


def apply_discount(price: Decimal, percent: int) -> Decimal:
    if percent < 0 or percent > 100:
        raise ValueError("percent must be 0..100")
    if price < 0:
        raise ValueError("price must be non-negative")
    factor = Decimal(100 - percent) / Decimal(100)
    return (price * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def bulk_price(unit_price: Decimal, quantity: int, *, tier2_at: int = 10, tier2_pct: int = 5) -> Decimal:
    if quantity <= 0:
        raise ValueError("quantity must be positive")
    subtotal = unit_price * quantity
    if quantity >= tier2_at:
        return apply_discount(subtotal, tier2_pct)
    return subtotal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
