# 05. Two pointers

## Intro

Two indices over an array/string — O(n) instead of O(n²). Works on a **sorted** array or when moving `left`/`right` **monotonically** narrows the search space.

---

## Templates

### Opposite ends (sorted array)

```python
def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        if s < target:
            left += 1
        else:
            right -= 1
    return []
```

### Same direction (fast/slow)

```python
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    w = 1
    for r in range(1, len(nums)):
        if nums[r] != nums[r - 1]:
            nums[w] = nums[r]
            w += 1
    return w
```

### Container with most water

Move the pointer with the **smaller** height — the only way to increase the area.

---

## When to apply

| Signal | Pattern |
|--------|---------|
| Sorted + pair sum | opposite |
| In-place compact | write/read |
| Palindrome | left/right toward the center |
| Linked list cycle | Floyd slow/fast |

---

## Complexity

Time O(n), memory O(1) — a common answer at the interview.

---

## Course code

[`examples/problems/ch05_two_pointers.py`](examples/problems/ch05_two_pointers.py) → `pytest tests/test_ch05.py`.

---

## Subtasks

**Time:** ~70 min.

### 5.1 Code (25 min)

Implement the three functions in `ch05_two_pointers.py` until pytest is green.

### 5.2 Valid Palindrome (15 min)

String: letters/digits only, ignore case — two pointers, O(n) time, O(1) space.

### 5.3 3Sum (20 min)

On paper: sort + fix i + two pointers; avoid duplicate triples.

### 5.4 Trapping Rain Water (10 min)

Name two approaches: prefix max vs two pointers — which one's space?

### 5.5 Out loud (5 min)

Explain why in Container we move the smaller height.

---

## Checklist

- [ ] pytest ch05 green?
- [ ] Palindrome solved?
- [ ] 3Sum sketched?

**Next:** [06. Sliding window](06-sliding-window.md).
