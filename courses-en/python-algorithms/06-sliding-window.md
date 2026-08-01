# 06. Sliding window

## Intro

A **fixed** or **variable** length subarray/substring — expand and shrink the window `[left, right]` in O(n).

---

## Fixed size k

```python
def max_sum_subarray_k(nums: list[int], k: int) -> int:
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]
        best = max(best, window)
    return best
```

---

## Variable window + invariant

```python
def longest_unique(s: str) -> int:
    seen: set[str] = set()
    left = 0
    best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best
```

**Invariant:** the window is always valid (no repeats / sum ≤ target).

---

## Sum ≥ target (min length)

Expand `right` while sum < target; then shrink `left`.

---

## Subtasks

**Time:** ~70 min.

### 6.1 Fixed k (15 min)

Implement max sum subarray of size k.

### 6.2 Longest repeating char replacement (25 min)

Window with `max_freq + k >= window_size` — code or pseudocode.

### 6.3 Minimum window substring (25 min)

Contains all characters of `t` — variable window + Counter need/have.

### 6.4 Complexity (5 min)

Why is it amortized O(n), even with the inner while?

---

## Checklist

- [ ] Can you tell fixed vs variable?
- [ ] Do you know the "while invalid: left++" template?

**Next:** [07. Prefix sum](07-prefix-sum.md).
