# 20. Heap / priority queue

## Intro

K-th largest, merge k sorted, median stream — a **heap** gives O(log n) push/pop. Python: only a min-heap in `heapq`.

---

## K-th largest

```python
def kth_largest(nums: list[int], k: int) -> int:
  h = nums[:k]
  heapq.heapify(h)
  for x in nums[k:]:
      if x > h[0]:
          heapq.heapreplace(h, x)
  return h[0]
```

Or `heapq.nlargest(k, nums)[-1]`.

---

## Merge k lists

Heap tuples `(val, list_id, node)` — classic.

---

## Top K frequent

Bucket sort by frequency O(n) or a heap O(n log k).

---

## Subtasks

**Time:** ~70 min.

### 20.1 Kth largest (15 min)

Code for a heap of size k.

### 20.2 Merge k sorted lists (25 min)

Full code with ListNode.

### 20.3 Find median from data stream (25 min)

Two heaps: max-left, min-right — balance the sizes.

### 20.4 Task scheduler (5 min)

Greedy + heap (cooldown) — the idea.

---

## Checklist

- [ ] Max-heap via negate?
- [ ] Merge k O(N log k)?

**Next:** [21. Intervals](21-intervals.md).
