# 03. Python for algorithms: stdlib and idioms

## Intro

Python is allowed at the interview — use the **stdlib**, don't reinvent deque/hash. This chapter is the "arsenal" that should be in your muscle memory.

---

## collections

```python
from collections import Counter, defaultdict, deque

cnt = Counter("abracadabra")  # frequencies
graph: dict[int, list[int]] = defaultdict(list)
q: deque[int] = deque([0])
q.append(1)
x = q.popleft()  # O(1)
```

| Type | When |
|-----|-------|
| `deque` | BFS, sliding window max (with monotonic) |
| `Counter` | anagrams, frequencies |
| `defaultdict` | graph, grouping |

---

## heapq (min-heap)

```python
import heapq

h = [3, 1, 4]
heapq.heapify(h)           # O(n)
heapq.heappush(h, 2)
smallest = heapq.heappop(h)  # O(log n)

# max-heap: invert the sign
heapq.heappush(h, -val)
```

`heapq.nlargest(k, nums)` — O(n log k).

---

## bisect (binary search in a sorted array)

```python
import bisect

nums = [1, 3, 3, 5]
i = bisect.bisect_left(nums, 3)   # 1
bisect.insort(nums, 4)
```

---

## itertools

```python
from itertools import accumulate, permutations, combinations

prefix = list(accumulate(nums))  # prefix sum
```

---

## functools

```python
from functools import cache, lru_cache

@cache
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```

For DP with **mutable** arguments, `lru_cache` won't work; build the table by hand.

---

## Useful tricks

```python
# swap
a, b = b, a

# enumerate with start
for i, x in enumerate(nums, start=1):

# sort with key
sorted(words, key=lambda w: (-len(w), w))

# inf
best = float("inf")

# divmod for grid coordinates
r, c = divmod(idx, cols)
```

---

## typing at the interview

```python
def solve(grid: list[list[int]]) -> int:
    ...
```

`list`, `dict`, `Optional` are enough — don't overcomplicate with `TypeVar`.

---

## Subtasks

**Time:** ~60 min.

### 3.1 Snippet drill (20 min)

Without an IDE, write from scratch: a `deque` BFS traversal over an adjacency list; a `Counter` to check an anagram; `heappush`/`heappop` for the 3 smallest.

### 3.2 bisect (10 min)

In a sorted array, find the **first** index `>= target` — one line with `bisect`.

### 3.3 @cache (10 min)

Fibonacci with `@cache` — time/space? When to drop the cache at the interview (state size)?

### 3.4 Refactor (10 min)

Replace `list.pop(0)` in BFS with a `deque` — why?

### 3.5 Cheat sheet (10 min)

In `mistakes.md`, add 5 lines "stdlib → problem" (heap → k-th largest, …).

---

## Summary

`deque`, `heapq`, `bisect`, `Counter`, `defaultdict`, `@cache` — 80% of the solution infrastructure.

---

## Checklist

- [ ] BFS only with deque?
- [ ] Know max-heap via the minus trick?
- [ ] bisect_left vs bisect_right?

**Next:** [04. Pattern recognition](04-pattern-recognition.md).
