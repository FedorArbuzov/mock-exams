# 04. Объекты, type, class, MRO

## Введение

В Python **всё объект**, включая `class` и `function`. `type(x)` — метакласс экземпляра (обычно `type`).

---

## type и class

```python
class Dog: ...
d = Dog()
type(d)        # <class 'Dog'>
type(Dog)      # <class 'type'>
isinstance(d, Dog)  # True
```

---

## MRO (Method Resolution Order)

```python
class A: ...
class B(A): ...
class C(A): ...
class D(B, C): ...

D.__mro__  # D, B, C, A, object
```

**C3 linearization** — предсказуемый порядок `super()`.

---

## super()

```python
class B(A):
    def method(self):
        super().method()  # следующий в MRO, не обязательно A
```

---

## Подзадачи

**Время:** ~60 мин.

### 4.1 Diamond (20 мин)

Классический diamond; нарисуйте MRO; вызовите `super()` chain.

### 4.2 type() factory (15 мин)

`type('MyClass', (object,), {'x': 1})` — эквивалент class statement.

### 4.3 Interview (15 мин)

«Разница class vs instance» + MRO за 2 мин.

### 4.4 mixin (10 мин)

Один mixin из вашего кода — зачем порядок наследования.

---

## Чек-лист

- [ ] Читаете `__mro__`?
- [ ] super() не «только родитель»?

**Дальше:** [05. Mutability](05-mutability-copy.md).
