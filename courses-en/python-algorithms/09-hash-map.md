# 09. Hash map / set patterns

## Intro

`dict`/`set` — O(1) lookup → Two Sum, frequencies, indices, dedup. The **key** is a value, an index, or a tuple of characteristics.

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

Only the starts of a chain — O(n) total.

---

## Course code

[`examples/problems/ch09_hash_map.py`](examples/problems/ch09_hash_map.py) → `pytest tests/test_ch09.py`.

---

## Subtasks

**Time:** ~75 min.

### 9.1 pytest ch09 (25 min)

Three functions until green.

### 9.2 Contains duplicate / anagram (10 min)

One-liner ideas with set/Counter.

### 9.3 Top K frequent (20 min)

heapq vs bucket sort O(n).

### 9.4 LRU Cache (20 min)

OrderedDict or dict+linked — sketch the class (medium-hard).

---

## Checklist

- [ ] ch09 green?
- [ ] Longest consecutive O(n) without sort?

**Next:** [10. Sorting](10-sorting.md).
