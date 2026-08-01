# 14. Monotonic stack / deque

## Intro

A stack with **monotonically increasing/decreasing** values — next greater element, histogram, sliding window maximum.

---

## Next greater element

```python
def next_greater(nums: list[int]) -> list[int]:
    res = [-1] * len(nums)
    stack: list[int] = []  # indices
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            j = stack.pop()
            res[j] = x
        stack.append(i)
    return res
```

---

## Sliding window maximum

A `deque` of indices, front — the max in the window; remove `< x` from the back.

---

## Largest rectangle in histogram

A stack of increasing heights + sentinel — a classic hard.

---

## Subtasks

**Time:** ~70 min.

### 14.1 Daily temperatures (15 min)

Code with a monotonic stack.

### 14.2 Sliding window max (25 min)

Deque solution O(n).

### 14.3 Trapping rain water (20 min)

Two pointers **or** stack — one solution in code.

### 14.4 Complexity (10 min)

Why does each element being pushed/popped once → O(n)?

---

## Checklist

- [ ] Stack stores indices not values (when needed)?
- [ ] Sliding max O(n)?

**Next:** [15. Tree traversals](15-tree-traversals.md).
