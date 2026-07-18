# 10. Сортировки и когда какую

## Введение

`sorted(nums)` / `nums.sort()` — O(n log n). На интервью важно **зачем** сортируем: two pointers, greedy, binary search на ответе.

---

## Встроенная сортировка

```python
pairs = sorted(items, key=lambda x: (x[1], -x[0]))
```

Timsort — стабильный, O(n log n) worst.

---

## Когда sort — часть решения

| Задача | После sort |
|--------|------------|
| 3Sum | fix + two pointers |
| Merge intervals | по start |
| Non-overlapping intervals | greedy по end |
| Find duplicate | sort или Floyd |

---

## Counting sort / bucket

Значения в малом диапазоне [0, k] — O(n+k). «Top k» — bucket по частоте.

---

## Не сортируйте зря

Если уже O(n) hash решение — sort только ухудшит.

---

## Подзадачи

**Время:** ~60 мин.

### 10.1 Custom sort (15 мин)

`intervals` merge — sort by start, один проход merge.

### 10.2 Largest number (15 мин)

`cmp` через concat: `3` vs `30` → `330` > `303`.

### 10.3 Sort colors (15 мин)

Dutch national flag — 3 pointers O(n).

### 10.4 Kth largest (15 мин)

`heapq.nlargest` vs quickselect — complexity?

---

## Чек-лист

- [ ] key= tuple для multi-field?
- [ ] Знаете merge intervals?

**Дальше:** [11. Binary search](11-binary-search.md).
