# 11. Binary search and bisect

## Intro

Not just "find x in a sorted array" — **binary search on the answer**: minimum capacity, maximum minimum distance, if the predicate is monotonic.

---

## Classic BS

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

One half is always sorted — compare `target` with the boundaries.

---

## BS on the answer

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

## Course code

[`examples/problems/ch11_binary_search.py`](examples/problems/ch11_binary_search.py) → `pytest tests/test_ch11.py`.

---

## Subtasks

**Time:** ~75 min.

### 11.1 ch11 pytest (25 min)

`search_rotated`, `find_min_rotated`.

### 11.2 Lower bound (10 min)

First `>= target` via bisect_left.

### 11.3 Koko eating bananas (20 min)

BS on the answer — pseudocode for `can(mid)`.

### 11.4 Median of two sorted arrays (20 min)

On paper: partition O(log(min(m,n))) — at least the idea.

---

## Checklist

- [ ] ch11 green?
- [ ] Is the lo/hi invariant clear?
- [ ] Do you spot BS on the answer?

**Next:** [12. Stack and queue](12-stack-queue.md).
