# 02. Complexity: Big-O, amortization, master theorem

## Intro

"O(n)" at the interview isn't a formality. The interviewer is checking whether you spot an **unnecessary nested loop** and **memory growth** before writing the code.

---

## Asymptotic notation

| Notation | Meaning |
|-------------|-------|
| O(f) | upper bound (usually worst case) |
| Ω(f) | lower bound |
| Θ(f) | tight bound |

In practice people say "O(n)" = "linear in n".

---

## Typical complexities

| Complexity | Example n=10⁵ |
|-----------|--------------|
| O(1) | hash lookup |
| O(log n) | binary search |
| O(n) | single pass |
| O(n log n) | sort |
| O(n²) | nested loops over n |
| O(2ⁿ) | brute subset without DP |
| O(n!) | brute permutations |

**Rule:** n ≤ 10⁶ → O(n) or O(n log n) is fine; O(n²) — risk of TLE.

---

## Analyzing code

```python
def f(nums: list[int]) -> int:
    s = set(nums)          # O(n)
    for x in nums:         # O(n)
        if x + 1 in s:     # O(1) avg
            ...
    return 0
# Time O(n), Space O(n)
```

Nesting:

```python
for i in range(n):
    for j in range(i, n):  # O(n²)
        ...
```

---

## Amortization

`list.append` — amortized O(1): the array doubles only rarely.

`dict`/`set` — O(1) average, O(n) worst (rare at interviews).

---

## Recursion

```python
def dfs(node):
    if not node:
        return 0
    return 1 + dfs(node.left) + dfs(node.right)
```

Tree: time O(n), call stack **O(h)** of the height (O(n) worst skewed).

---

## Master theorem (for divide & conquer)

`T(n) = aT(n/b) + O(n^d)` — for merge sort: a=2, b=2, d=1 → O(n log n).

At the interview **intuition** is enough: split in half → +log n levels.

---

## Subtasks

**Time:** ~55 min.

### 2.1 Classification (15 min)

Estimate the complexity (time) without code:

1. Binary search in an array of length n  
2. Sorting with the built-in `sorted()`  
3. All pairs `(i,j)` in an array  
4. BFS over a graph with V vertices, E edges  

### 2.2 Analyzing a snippet (15 min)

```python
def g(n):
    i = n
    while i > 0:
        i //= 2
```

Answer: O(?) — explain.

### 2.3 Space (10 min)

Two Sum with a `dict` — time/space? Two pointers on a **sorted** array — space?

### 2.4 Limit on n (10 min)

n=10⁵, an O(n²) algorithm — will it pass? n=20, O(2ⁿ) — will it pass?

### 2.5 Out loud at the interview (5 min)

Write down the phrase: "Time O(…) because …; memory O(…) due to …".

---

## Summary

First the **estimate**, then the code. n and the time limit determine the acceptable complexity class.

---

## Checklist

- [ ] Can you tell O(n) from O(n log n)?
- [ ] Do you account for set/recursion stack memory?
- [ ] Do you know the n² limit?

**Next:** [03. Python stdlib](03-python-stdlib.md).
