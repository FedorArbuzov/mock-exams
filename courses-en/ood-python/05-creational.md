# 05. Creational: factory, builder, singleton

## Intro

Creational is about **how to create** objects without `if type` scattered throughout the code.

---

## Factory / factory method

```python
class PaymentFactory:
    @staticmethod
    def create(kind: str) -> PaymentProcessor:
        if kind == "stripe":
            return StripeProcessor()
        if kind == "paypal":
            return PayPalProcessor()
        raise ValueError(kind)
```

A registry dict is better for OCP.

---

## Builder

A complex object built step by step:

```python
class EmailBuilder:
    def subject(self, s: str): ...
    def body(self, b: str): ...
    def build(self) -> Email: ...
```

---

## Singleton — be careful

Global state, tests break. In the interview: "I know the pattern; in Python I prefer module-level or DI".

```python
# module is a singleton
# config.py
settings = Settings()
```

---

## Sub-tasks

**Time:** ~50 min.

### 5.1 Factory (20 min)

`VehicleFactory` for parking (car/bus/motorcycle objects).

### 5.2 Builder (15 min)

`HttpRequestBuilder` sketch.

### 5.3 Singleton critique (15 min)

3 reasons not to use it in a prod API.

---

## Checklist

- [ ] Factory vs constructor?
- [ ] Singleton skepticism?

**Next:** [06. Structural](06-structural.md).
