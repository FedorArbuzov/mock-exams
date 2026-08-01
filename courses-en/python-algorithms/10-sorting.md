# 10. Sorting and when to use which

## Intro

`sorted(nums)` / `nums.sort()` — O(n log n). At the interview what matters is **why** you sort: two pointers, greedy, binary search on the answer.

---

## Built-in sort

```python
pairs = sorted(items, key=lambda x: (x[1], -x[0]))
```

Timsort — stable, O(n log n) worst.

---

## When sort is part of the solution

| Problem | After sort |
|--------|------------|
| 3Sum | fix + two pointers |
| Merge intervals | by start |
| Non-overlapping intervals | greedy by end |
| Find duplicate | sort or Floyd |

---

## Counting sort / bucket

Values in a small range [0, k] — O(n+k). "Top k" — bucket by frequency.

---

## Don't sort for nothing

If you already have an O(n) hash solution, sorting only makes it worse.

---

## Subtasks

**Time:** ~60 min.

### 10.1 Custom sort (15 min)

`intervals` merge — sort by start, single-pass merge.

### 10.2 Largest number (15 min)

`cmp` via concat: `3` vs `30` → `330` > `303`.

### 10.3 Sort colors (15 min)

Dutch national flag — 3 pointers O(n).

### 10.4 Kth largest (15 min)

`heapq.nlargest` vs quickselect — complexity?

---

## Checklist

- [ ] key= tuple for multi-field?
- [ ] Do you know merge intervals?

**Next:** [11. Binary search](11-binary-search.md).
