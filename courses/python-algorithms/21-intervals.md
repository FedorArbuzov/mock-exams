# 21. Интервалы: merge, insert

## Введение

Интервалы `[start, end]` — sort by start, sweep line, merge overlapping.

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

Merge on the fly или binary search position + merge neighbors.

---

## Meeting rooms II

Min heap концов встреч — count overlap.

---

## Non-overlapping intervals

Greedy: sort by end, take max count non-overlap.

---

## Подзадачи

**Время:** ~65 мин.

### 21.1 Merge (10 мин)

Код.

### 21.2 Insert (20 мин)

`intervals` sorted, new interval.

### 21.3 Meeting rooms II (20 мин)

Heap solution.

### 21.4 Minimum arrows balloons (15 мин)

Greedy по end — как non-overlapping.

---

## Чек-лист

- [ ] Sort by start or end осознанно?
- [ ] Merge O(n log n)?

**Дальше:** [22. DP 1D](22-dp-1d.md).
