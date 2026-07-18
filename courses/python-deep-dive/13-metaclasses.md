# 13. Metaclasses (когда и зачем)

## Введение

`type` — metaclass по умолчанию. `class Foo: pass` → `type('Foo', (), {})` эквивалент на низком уровне.

**На интервью:** знать **концепцию**; в prod — редко, чаще **decorator** или `__init_subclass__`.

---

## `__init_subclass__` (часто лучше)

```python
class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.registry = getattr(cls, 'registry', [])
        cls.registry.append(cls)
```

---

## Metaclass use cases

| Кейс | Альтернатива |
|------|--------------|
| Регистрация подклассов | `__init_subclass__` |
| Валидация attrs | Pydantic, dataclass |
| ORM | SQLAlchemy делает за вас |

```python
class Meta(type):
    def __new__(mcs, name, bases, namespace):
        ...
        return super().__new__(mcs, name, bases, namespace)
```

---

## Подзадачи

**Время:** ~50 мин.

### 13.1 init_subclass (20 мин)

Plugin registry на 3 класса.

### 13.2 Когда НЕ metaclass (15 мин)

3 ситуации из опыта — проще decorator.

### 13.3 Interview (15 мин)

«Что такое metaclass?» 90 сек без overclaim.

---

## Чек-лист

- [ ] Знаете __init_subclass__?
- [ ] Не предлагаете metaclass везде?

**Дальше:** [14. __slots__](14-slots.md).
