class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive")
        obj.__dict__[self.name] = value


class Order:
    quantity = Positive()
    price = Positive()

    def __init__(self, quantity: int, price: float):
        self.quantity = quantity
        self.price = price
