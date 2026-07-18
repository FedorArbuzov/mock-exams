# 11. Бинарный поиск и bisect

## Введение

Не только «найти x в sorted» — **binary search on answer**: минимальный capacity, максимальный минимум расстояния, если predicate монотонен.

---

## Классический BS

```python
def binary_search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

---

## Rotated sorted array

Одна половина всегда sorted — сравниваем `target` с границами.

---

## BS on answer

```python
def can_ship(capacity: int) -> bool:
    ...

lo, hi = min_cap, sum(weights)
while lo < hi:
    mid = (lo + hi) // 2
    if can_ship(mid):
        hi = mid
    else:
        lo = mid + 1
```

---

## Код в курсе

[`examples/problems/ch11_binary_search.py`](examples/problems/ch11_binary_search.py) → `pytest tests/test_ch11.py`.

---

## Подзадачи

**Время:** ~75 мин.

### 11.1 ch11 pytest (25 мин)

`search_rotated`, `find_min_rotated`.

### 11.2 Lower bound (10 мин)

Первый `>= target` через bisect_left.

### 11.3 Koko eating bananas (20 мин)

BS on answer — псевдокод `can(mid)`.

### 11.4 Median two sorted arrays (20 мин)

На бумаге: partition O(log(min(m,n))) — хотя бы идея.

---

## Чек-лист

- [ ] ch11 green?
- [ ] lo/hi invariant понятен?
- [ ] Видите BS on answer?

**Дальше:** [12. Stack и queue](12-stack-queue.md).
