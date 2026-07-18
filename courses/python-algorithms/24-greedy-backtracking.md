# 24. Greedy и backtracking

## Введение

**Greedy** — локальный выбор; нужно **обосновать** (exchange argument). **Backtracking** — перебор с отсечением; subsets/permutations/combinations.

---

## Greedy examples

| Задача | Greedy rule |
|--------|-------------|
| Jump game | max reach |
| Non-overlap intervals | earliest end |
| Assign cookies | sort both |

---

## Backtracking template

```python
def subsets(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    path: list[int] = []

    def dfs(i: int) -> None:
        res.append(path.copy())
        for j in range(i, len(nums)):
            path.append(nums[j])
            dfs(j + 1)
            path.pop()

    dfs(0)
    return res
```

---

## Pruning

Sudoku, N-Queens — отсечь ветку при конфликте рано.

---

## Подзадачи

**Время:** ~80 мин.

### 24.1 Subsets (15 мин)

Код template.

### 24.2 Permutations (20 мин)

`used` set или swap.

### 24.3 Combination sum (20 мин)

Reuse candidates — backtracking.

### 24.4 Jump game II (15 мин)

Greedy min jumps.

### 24.5 N-Queens (10 мин)

Sketch placement + column/diag sets.

---

## Чек-лист

- [ ] Backtracking с pop?
- [ ] Greedy можете защитить словами?

**Дальше:** [25. Процесс интервью](25-interview-process.md).
