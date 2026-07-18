# 14. Monotonic stack / deque

## Введение

Стек с **монотонно возрастающими/убывающими** значениями — next greater element, histogram, sliding window maximum.

---

## Next greater element

```python
def next_greater(nums: list[int]) -> list[int]:
    res = [-1] * len(nums)
    stack: list[int] = []  # indices
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            j = stack.pop()
            res[j] = x
        stack.append(i)
    return res
```

---

## Sliding window maximum

`deque` индексов, front — max в окне; удалять `< x` сзади.

---

## Largest rectangle in histogram

Стек возрастающих высот + sentinel — classic hard.

---

## Подзадачи

**Время:** ~70 мин.

### 14.1 Daily temperatures (15 мин)

Код с monotonic stack.

### 14.2 Sliding window max (25 мин)

Deque solution O(n).

### 14.3 Trapping rain water (20 мин)

Two pointers **или** stack — одно решение в коде.

### 14.4 Complexity (10 мин)

Почему каждый элемент push/pop once → O(n)?

---

## Чек-лист

- [ ] Stack stores indices not values (when needed)?
- [ ] Sliding max O(n)?

**Дальше:** [15. Обходы дерева](15-tree-traversals.md).
