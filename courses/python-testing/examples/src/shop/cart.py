"""In-memory cart — stateful, needs fixtures between tests."""
from dataclasses import dataclass, field
from decimal import Decimal

from shop.pricing import bulk_price


@dataclass
class CartItem:
    sku: str
    unit_price: Decimal
    quantity: int


@dataclass
class Cart:
    items: list[CartItem] = field(default_factory=list)

    def add(self, sku: str, unit_price: Decimal, quantity: int = 1) -> None:
        if quantity <= 0:
            raise ValueError("quantity must be positive")
        for item in self.items:
            if item.sku == sku:
                item.quantity += quantity
                return
        self.items.append(CartItem(sku=sku, unit_price=unit_price, quantity=quantity))

    def total(self) -> Decimal:
        total = Decimal("0")
        for item in self.items:
            total += bulk_price(item.unit_price, item.quantity)
        return total

    def clear(self) -> None:
        self.items.clear()
