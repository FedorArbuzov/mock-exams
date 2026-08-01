# Interview cheatsheet — Python Algorithms

A brief cheat sheet before the algorithmic section. Full course: [README](README.md). Practice: [examples/](examples/pyproject.toml).

---

## Complexity (rules of thumb)

| n | Acceptable |
|---|-----------|
| ≤ 10⁶ | O(n), O(n log n) |
| ≤ 10³ | O(n²) sometimes |
| ≤ 20 | O(2ⁿ) DP/bitmask |

---

## Pattern → problem

| Pattern | Key | Template |
|---------|------|--------|
| Two pointers | sorted, palindrome | left/right |
| Sliding window | substring, sum k | expand/shrink |
| Prefix sum | range sum, subarray k | dict prefix |
| Hash map | two sum, freq | seen[key]=i |
| Binary search | sorted, min max answer | lo/hi |
| Monotonic stack | next greater | indices stack |
| Heap | top k, merge k | heapq size k |
| DFS tree | path, depth | recursive |
| BFS graph | shortest unweighted | deque |
| Topo | dependencies | indegree queue |
| DSU | connected | union find |
| DP 1D | stairs, coins | dp[i] |
| DP 2D | grid, LCS | dp[i][j] |
| Backtracking | subsets | path push/pop |

---

## Python stdlib

```python
from collections import deque, Counter, defaultdict
import heapq, bisect
from functools import cache
```

`deque` BFS · `heapq` min-heap · `bisect_left` lower bound · `Counter` anagram

---

## Tree / list

```python
# reverse list
prev, cur = None, head
while cur:
    nxt, cur.next, prev, cur = cur.next, prev, cur, nxt

# DFS tree
if not node: return
```

---

## 45-min interview

1. Clarify n, edge cases  
2. Brute → optimize + O()  
3. Code with typing  
4. Test example + empty  
5. Follow-up space  

---

## Edge cases

`[]` · `[1]` · duplicates · negative · `None` head · all same

---

## Related courses

[python-testing](../python-testing/README.md) · [microservices-patterns](../microservices-patterns/README.md) (system design)
