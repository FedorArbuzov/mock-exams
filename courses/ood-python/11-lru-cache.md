# 11. LRU Cache

## Введение

Часто **OOD + coding**: класс `LRUCache` с `get`/`put` O(1). Связь с [python-algorithms/09](../python-algorithms/09-hash-tables.md) (OrderedDict).

---

## API

```python
cache = LRUCache(2)
cache.put(1, 1)
cache.get(1)      # 1
cache.put(3, 3)   # evicts key 2
cache.get(2)      # -1
```

---

## Дизайн

| Подход | get/put |
|--------|---------|
| OrderedDict | O(1) amortized |
| dict + doubly linked list | O(1) strict |
| list + dict | O(n) — слабо |

На интервью OrderedDict достаточно; назовите linked list как «production-grade».

---

## OOD угол

- `Cache` Protocol
- `LRUCache` implementation
- `TTLCache` extension (strategy)

---

## Подзадачи

**Время:** ~70 мин.

### 11.1 API + complexity (10 мин)

Объясните O(1) устно.

### 11.2 Code (40 мин)

`examples/ood/lru_cache.py`.

### 11.3 Thread-safety (20 мин)

Что добавить для concurrent access? (lock around ops)

---

## Чек-лист

- [ ] Eviction correct?
- [ ] Update existing key refreshes LRU?

**Дальше:** [12. Rate limiter](12-rate-limiter.md).
