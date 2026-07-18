# 05. Creational: factory, builder, singleton

## Введение

Creational — **как создавать** объекты без `if type` по всему коду.

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

Лучше registry dict для OCP.

---

## Builder

Сложный объект по шагам:

```python
class EmailBuilder:
    def subject(self, s: str): ...
    def body(self, b: str): ...
    def build(self) -> Email: ...
```

---

## Singleton — осторожно

Глобальное состояние, тесты ломаются. На интервью: «знаю паттерн, в Python предпочитаю module-level или DI».

```python
# module is a singleton
# config.py
settings = Settings()
```

---

## Подзадачи

**Время:** ~50 мин.

### 5.1 Factory (20 мин)

`VehicleFactory` для parking (car/bus/motorcycle objects).

### 5.2 Builder (15 мин)

`HttpRequestBuilder` sketch.

### 5.3 Singleton critique (15 мин)

3 причины не использовать в prod API.

---

## Чек-лист

- [ ] Factory vs constructor?
- [ ] Singleton skepticism?

**Дальше:** [06. Structural](06-structural.md).
