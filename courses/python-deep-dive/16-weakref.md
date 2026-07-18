# 16. weakref и циклические ссылки

## Введение

**weakref** — ссылка не увеличивает refcount. Кэши, graphs, observer patterns без утечек.

---

## API

```python
import weakref

class Big: pass
obj = Big()
r = weakref.ref(obj)
r() is obj  # True
del obj
r() is None   # collected
```

`WeakValueDictionary` — cache по id без удержания объектов.

---

## Циклы

Цикл list↔list: GC спасает. Цикл с `__del__` — historic pain; в modern CPython реже проблема.

---

## Подзадачи

**Время:** ~45 мин.

### 16.1 weakref demo (15 мин)

ref до и после del.

### 16.2 Cache pattern (15 мин)

WeakValueDictionary sketch для ORM-like cache.

### 16.3 Interview (15 мин)

«Как weakref отличается от обычной ссылки?»

---

## Чек-лист

- [ ] weakref не prevents GC?
- [ ] Знаете WeakValueDictionary?

**Дальше:** [17. Threading](17-threading-multiprocessing.md).
