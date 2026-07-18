# 09. Исключения

## Введение

`except Exception` ловит почти всё — **не** ловите `KeyboardInterrupt` без нужды. Иерархия: `BaseException` → `Exception` → конкретные.

---

## Best practices

```python
try:
    ...
except SpecificError as e:
    ...
else:
    ...  # no exception
finally:
    ...  # always
```

| Антипаттерн | Почему |
|--------------|--------|
| bare `except:` | скрывает баги |
| pass в except | молчаливый сбой |
| исключения для flow control | медленно, нечитаемо |

---

## Exception chaining

```python
raise NewError("context") from original
```

`__cause__` в traceback.

---

## Подзадачи

**Время:** ~50 мин.

### 9.1 Hierarchy (15 мин)

Нарисуйте BaseException tree (5 веток).

### 9.2 Refactor (20 мин)

Плоский `except Exception` → specific из вашего кода (учебный).

### 9.3 Interview (15 мин)

«Когда finally не выполнится?» (process kill, os._exit).

---

## Чек-лист

- [ ] Specific except?
- [ ] raise from?

**Дальше:** [10. Import](10-import-system.md).
