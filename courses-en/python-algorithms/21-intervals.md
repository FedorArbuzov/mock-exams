# 21. Intervals: merge, insert

## Intro

Intervals `[start, end]` — sort by start, sweep line, merge overlapping.

---

## Merge intervals

```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    out: list[list[int]] = []
    for s, e in intervals:
        if not out or s > out[-1][1]:
            out.append([s, e])
        else:
            out[-1][1] = max(out[-1][1], e)
    return out
```

---

## Insert interval

Merge on the fly or binary search the position + merge neighbors.

---

## Meeting rooms II

Min heap of meeting ends — count overlap.

---

## Non-overlapping intervals

Greedy: sort by end, take the max count of non-overlapping.

---

## Subtasks

**Time:** ~65 min.

### 21.1 Merge (10 min)

Code.

### 21.2 Insert (20 min)

`intervals` sorted, a new interval.

### 21.3 Meeting rooms II (20 min)

Heap solution.

### 21.4 Minimum arrows balloons (15 min)

Greedy by end — like non-overlapping.

---

## Checklist

- [ ] Sort by start or end deliberately?
- [ ] Merge O(n log n)?

**Next:** [22. DP 1D](22-dp-1d.md).
