# 07. Prefix sum и difference array

## Введение

Много запросов «сумма на отрезке [l,r]» — префиксы за O(1) на запрос. **Difference array** — O(1) range update.

---

## Prefix sum

```python
def build_prefix(nums: list[int]) -> list[int]:
    pref = [0]
    for x in nums:
        pref.append(pref[-1] + x)
    return pref

def range_sum(pref: list[int], l: int, r: int) -> int:  # inclusive l,r
    return pref[r + 1] - pref[l]
```

`itertools.accumulate` — то же с `initial=0`.

---

## Subarray sum equals k (hash + prefix)

```python
count = 0
pref = 0
freq: dict[int, int] = defaultdict(int)
freq[0] = 1
for x in nums:
    pref += x
    count += freq[pref - k]
    freq[pref] += 1
```

---

## 2D prefix (матрица)

`pref[i+1][j+1] = sum rect` — для подматриц; реже на интервью middle.

---

## Difference array

```python
def range_add(diff: list[int], l: int, r: int, val: int) -> None:
    diff[l] += val
    if r + 1 < len(diff):
        diff[r + 1] -= val
# восстановление: running sum по diff
```

---

## Подзадачи

**Время:** ~65 мин.

### 7.1 Range sum queries (15 мин)

Префиксы + 5 запросов на бумаге.

### 7.2 Subarray sum equals k (25 мин)

Полный код на Python.

### 7.3 Product of array except self (15 мин)

Prefix/suffix без деления — O(n).

### 7.4 Difference (10 мин)

Массив нулей, 3 операции range add — восстановить итог.

---

## Чек-лист

- [ ] prefix[i] = sum(nums[:i])?
- [ ] Subarray sum k без O(n²)?

**Дальше:** [08. Строки](08-strings.md).
