# 06. Sliding window

## Введение

Подмассив/подстрока **фиксированной** или **переменной** длины — окно `[left, right]` расширяем и сужаем за O(n).

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

**Инвариант:** окно всегда валидно (без повторов / сумма ≤ target).

---

## Сумма ≥ target (min length)

Расширяем `right`, пока sum < target; затем сжимаем `left`.

---

## Подзадачи

**Время:** ~70 мин.

### 6.1 Fixed k (15 мин)

Реализуйте max sum subarray size k.

### 6.2 Longest repeating char replacement (25 мин)

Окно с `max_freq + k >= window_size` — код или псевдокод.

### 6.3 Minimum window substring (25 мин)

Содержит все символы `t` — variable window + Counter need/have.

### 6.4 Сложность (5 мин)

Почему amortized O(n), хотя внутренний while?

---

## Чек-лист

- [ ] Отличаете fixed vs variable?
- [ ] Знаете шаблон «while invalid: left++»?

**Дальше:** [07. Prefix sum](07-prefix-sum.md).
