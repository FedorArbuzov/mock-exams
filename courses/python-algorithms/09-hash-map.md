# 09. Hash map / set паттерны

## Введение

`dict`/`set` — O(1) lookup → Two Sum, частоты, индексы, дедуп. **Ключ** — значение, индекс, tuple характеристик.

---

## Two Sum

```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []
```

---

## Longest consecutive sequence

```python
def longest_consecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:  # start of streak
            cur = x
            length = 1
            while cur + 1 in s:
                cur += 1
                length += 1
            best = max(best, length)
    return best
```

Только старты цепочки — O(n) total.

---

## Код в курсе

[`examples/problems/ch09_hash_map.py`](examples/problems/ch09_hash_map.py) → `pytest tests/test_ch09.py`.

---

## Подзадачи

**Время:** ~75 мин.

### 9.1 pytest ch09 (25 мин)

Три функции до green.

### 9.2 Contains duplicate / anagram (10 мин)

One-liner идеи с set/Counter.

### 9.3 Top K frequent (20 мин)

heapq vs bucket sort O(n).

### 9.4 LRU Cache (20 мин)

OrderedDict или dict+linked — sketch класса (medium-hard).

---

## Чек-лист

- [ ] ch09 green?
- [ ] Longest consecutive O(n) без sort?

**Дальше:** [10. Сортировки](10-sorting.md).
