# 05. Two pointers

## Введение

Два индекса по массиву/строке — O(n) вместо O(n²). Работает на **sorted** или когда движение `left`/`right` **монотонно** сужает пространство.

---

## Шаблоны

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

Двигаем указатель с **меньшей** высотой — единственный способ увеличить площадь.

---

## Когда применять

| Сигнал | Паттерн |
|--------|---------|
| Sorted + пара суммы | opposite |
| In-place compact | write/read |
| Палиндром | left/right к центру |
| Linked list cycle | Floyd slow/fast |

---

## Сложность

Время O(n), память O(1) — частый ответ на интервью.

---

## Код в курсе

[`examples/problems/ch05_two_pointers.py`](examples/problems/ch05_two_pointers.py) → `pytest tests/test_ch05.py`.

---

## Подзадачи

**Время:** ~70 мин.

### 5.1 Код (25 мин)

Реализуйте три функции в `ch05_two_pointers.py` до зелёного pytest.

### 5.2 Valid Palindrome (15 мин)

Строка: только буквы/цифры, ignore case — two pointers, O(n) time, O(1) space.

### 5.3 3Sum (20 мин)

На бумаге: sort + fix i + two pointers; избежать дубликатов троек.

### 5.4 Trapping Rain Water (10 мин)

Назовите два подхода: prefix max vs two pointers — какой space?

### 5.5 Устно (5 мин)

Объясните, почему в Container двигаем меньшую высоту.

---

## Чек-лист

- [ ] pytest ch05 green?
- [ ] Palindrome решена?
- [ ] 3Sum sketched?

**Дальше:** [06. Sliding window](06-sliding-window.md).
