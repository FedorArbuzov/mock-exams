# Interview cheatsheet — Python Algorithms

Краткая шпаргалка перед алгоритмической секцией. Полный курс: [README](README.md). Практика: [examples/](examples/pyproject.toml).

---

## Сложность (ориентиры)

| n | Допустимо |
|---|-----------|
| ≤ 10⁶ | O(n), O(n log n) |
| ≤ 10³ | O(n²) иногда |
| ≤ 20 | O(2ⁿ) DP/bitmask |

---

## Паттерн → задача

| Паттерн | Ключ | Шаблон |
|---------|------|--------|
| Two pointers | sorted, palindrome | left/right |
| Sliding window | подстрока, sum k | expand/shrink |
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

## Дерево / список

```python
# reverse list
prev, cur = None, head
while cur:
    nxt, cur.next, prev, cur = cur.next, prev, cur, nxt

# DFS tree
if not node: return
```

---

## Интервью 45 мин

1. Уточнить n, edge cases  
2. Brute → optimize + O()  
3. Код с typing  
4. Тест пример + empty  
5. Follow-up space  

---

## Edge cases

`[]` · `[1]` · duplicates · negative · `None` head · all same

---

## Связанные курсы

[python-testing](../python-testing/README.md) · [microservices-patterns](../microservices-patterns/README.md) (system design)
