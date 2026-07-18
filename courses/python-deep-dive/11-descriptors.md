# 11. Descriptors и `property`

## Введение

**Descriptor** — объект с `__get__` / `__set__` / `__delete__`. `property`, ORM fields, validated attributes — всё descriptors.

---

## Protocol

```python
class Desc:
    def __get__(self, obj, objtype=None):
        ...
    def __set__(self, obj, value):
        ...
```

На классе — **data descriptor**; на instance dict — instance attr wins **unless** data descriptor on class.

---

## property

```python
@property
def price(self):
    return self._price

@price.setter
def price(self, v):
    if v < 0: raise ValueError
    self._price = v
```

Под капотом — `property` is descriptor.

**Лаба:** [`examples/lab/descriptors.py`](examples/lab/descriptors.py).

---

## `__set_name__`

PEP 487 — descriptor знает имя атрибута (`Positive` в лабе).

---

## Подзадачи

**Время:** ~65 мин.

### 11.1 Order pytest (25 мин)

`Positive` descriptor green.

### 11.2 Typed property (20 мин)

Descriptor с type check str.

### 11.3 Interview (15 мин)

«Как работает @property?» — lookup order.

### 11.4 Django/FastAPI (5 мин)

Где descriptors в ORM/Pydantic (awareness).

---

## Чек-лист

- [ ] data vs non-data descriptor?
- [ ] lab green?

**Дальше:** [12. Dunder](12-dunder-methods.md).
