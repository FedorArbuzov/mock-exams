# 20. Heap / priority queue

## Введение

K-th largest, merge k sorted, median stream — **heap** O(log n) push/pop. Python: только min-heap в `heapq`.

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

Или `heapq.nlargest(k, nums)[-1]`.

---

## Merge k lists

Heap tuples `(val, list_id, node)` — classic.

---

## Top K frequent

Bucket sort по частоте O(n) или heap O(n log k).

---

## Подзадачи

**Время:** ~70 мин.

### 20.1 Kth largest (15 мин)

Код heap size k.

### 20.2 Merge k sorted lists (25 мин)

Полный код с ListNode.

### 20.3 Find median from data stream (25 мин)

Two heaps: max-left, min-right — balance sizes.

### 20.4 Task scheduler (5 мин)

Greedy + heap (cooldown) — идея.

---

## Чек-лист

- [ ] Max-heap через negate?
- [ ] Merge k O(N log k)?

**Дальше:** [21. Интервалы](21-intervals.md).
