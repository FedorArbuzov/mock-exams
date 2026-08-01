# 24. Greedy and backtracking

## Intro

**Greedy** — a local choice; you need to **justify** it (exchange argument). **Backtracking** — enumeration with pruning; subsets/permutations/combinations.

---

## Greedy examples

| Problem | Greedy rule |
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

Sudoku, N-Queens — cut off a branch early on a conflict.

---

## Subtasks

**Time:** ~80 min.

### 24.1 Subsets (15 min)

Template code.

### 24.2 Permutations (20 min)

`used` set or swap.

### 24.3 Combination sum (20 min)

Reuse candidates — backtracking.

### 24.4 Jump game II (15 min)

Greedy min jumps.

### 24.5 N-Queens (10 min)

Sketch placement + column/diag sets.

---

## Checklist

- [ ] Backtracking with pop?
- [ ] Can you defend greedy in words?

**Next:** [25. Interview process](25-interview-process.md).
