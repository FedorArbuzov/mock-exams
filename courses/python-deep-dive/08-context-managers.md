# 08. Context managers

## Введение

`with` гарантирует **cleanup** (файл, lock, transaction). Протокол: `__enter__` / `__exit__`.

---

## class-based

```python
class Managed:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        # cleanup; return True suppresses exception
        return False
```

---

## contextlib

```python
from contextlib import contextmanager

@contextmanager
def managed():
    setup()
    try:
        yield resource
    finally:
        teardown()
```

---

## Подзадачи

**Время:** ~50 мин.

### 8.1 Timer CM (20 мин)

Контекст печатает elapsed time.

### 8.2 suppress (10 мин)

`contextlib.suppress(FileNotFoundError)` — когда уместно.

### 8.3 Interview (15 мин)

«with open(...) что гарантирует?» + exception path.

### 8.4 async with (5 мин)

Связь [python-async](../python-async/README.md) — одна фраза.

---

## Чек-лист

- [ ] __exit__ return True?
- [ ] contextmanager yield once?

**Дальше:** [09. Exceptions](09-exceptions.md).
