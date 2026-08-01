# 11. LRU Cache

## Intro

Often **OOD + coding**: an `LRUCache` class with O(1) `get`/`put`. Related to [python-algorithms/09](../python-algorithms/09-hash-tables.md) (OrderedDict).

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

## Design

| Approach | get/put |
|--------|---------|
| OrderedDict | O(1) amortized |
| dict + doubly linked list | O(1) strict |
| list + dict | O(n) — weak |

In the interview OrderedDict is enough; mention the linked list as "production-grade".

---

## The OOD angle

- `Cache` Protocol
- `LRUCache` implementation
- `TTLCache` extension (strategy)

---

## Sub-tasks

**Time:** ~70 min.

### 11.1 API + complexity (10 min)

Explain the O(1) out loud.

### 11.2 Code (40 min)

`examples/ood/lru_cache.py`.

### 11.3 Thread-safety (20 min)

What to add for concurrent access? (lock around ops)

---

## Checklist

- [ ] Eviction correct?
- [ ] Does updating an existing key refresh the LRU?

**Next:** [12. Rate limiter](12-rate-limiter.md).
