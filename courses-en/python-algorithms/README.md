# Python Algorithms — preparing for the algorithmic interview section

A detailed course on **algorithms and data structures in Python** for live-coding and take-home: complexity, patterns, code templates, walkthroughs of typical problems, and **subtasks** in every chapter. Practice locally in a venv, [`examples/`](examples/pyproject.toml) + pytest.

**Who it's for:** backend Python developers ahead of an interview (Yandex, Avito, Ozon, international Big Tech, startups); engineers after [fastapi](../fastapi/README.md) / [django](../django/README.md) who need **dedicated** algorithmic preparation.

**Prerequisites:**

| Skill | Why |
|-------|--------|
| Python 3.11+ | syntax, typing, venv |
| Basic data structures | list, dict, set — at the "used it in a project" level |

**Useful in parallel:** [python-testing](../python-testing/README.md) (pytest), [python-deep-dive](../python-deep-dive/README.md) (GIL, memory, descriptors), [ood-python](../ood-python/README.md) (LRU, rate limiter OOD), [microservices-patterns](../microservices-patterns/README.md) (system design), [behavioral-interviews](../behavioral-interviews/README.md) (soft skills).

## How to read

- Chapters **01–24** — ~**50–70 min** (theory + **subtasks** + 1–3 problems in code).
- Chapters **25–26** — the interview process and a **mock week** (**4–6 h**).
- First **read the pattern**, then **close the IDE** and solve the subtask on paper/whiteboard, then code it in `examples/`.
- Keep a **mistakes notebook**: what you forgot (edge case, off-by-one, complexity).

**Time:** ~**35–45 hours** (a full pass with code).

## Local practice

```bash
cd courses/python-algorithms/examples
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest                    # all tests
pytest tests/test_ch05.py -v
```

`ListNode` / `TreeNode` structures: [`examples/algo/structures.py`](examples/algo/structures.py).

## Curriculum

### Part I — Foundations (01–04)

| # | Chapter |
|---|--------|
| 01 | [Interview landscape and preparation plan](01-interview-landscape.md) |
| 02 | [Complexity: Big-O, amortization, master theorem](02-complexity.md) |
| 03 | [Python for algorithms: stdlib and idioms](03-python-stdlib.md) |
| 04 | [How to recognize a problem's pattern](04-pattern-recognition.md) |

### Part II — Arrays and strings (05–08)

| # | Chapter |
|---|--------|
| 05 | [Two pointers](05-two-pointers.md) |
| 06 | [Sliding window](06-sliding-window.md) |
| 07 | [Prefix sum and difference array](07-prefix-sum.md) |
| 08 | [Strings: hashing, anagram, palindrome](08-strings.md) |

### Part III — Hashing and search (09–11)

| # | Chapter |
|---|--------|
| 09 | [Hash map / set patterns](09-hash-map.md) |
| 10 | [Sorting and when to use which](10-sorting.md) |
| 11 | [Binary search and bisect](11-binary-search.md) |

### Part IV — Linear structures (12–14)

| # | Chapter |
|---|--------|
| 12 | [Stack and queue](12-stack-queue.md) |
| 13 | [Linked list](13-linked-list.md) |
| 14 | [Monotonic stack / deque](14-monotonic-stack.md) |

### Part V — Trees (15–17)

| # | Chapter |
|---|--------|
| 15 | [Tree traversals: DFS, BFS](15-tree-traversals.md) |
| 16 | [BST: search, insert, validation](16-bst.md) |
| 17 | [DFS on trees: path, diameter, LCA](17-tree-dfs.md) |

### Part VI — Graphs (18–19)

| # | Chapter |
|---|--------|
| 18 | [Graph: BFS, DFS, adjacency matrix](18-graphs-bfs-dfs.md) |
| 19 | [Topological sort, Union-Find](19-topo-union-find.md) |

### Part VII — Advanced (20–24)

| # | Chapter |
|---|--------|
| 20 | [Heap / priority queue](20-heap.md) |
| 21 | [Intervals: merge, insert](21-intervals.md) |
| 22 | [Dynamic programming 1D](22-dp-1d.md) |
| 23 | [DP 2D and knapsack](23-dp-2d.md) |
| 24 | [Greedy and backtracking](24-greedy-backtracking.md) |

### Part VIII — Interview (25–26)

| # | Chapter |
|---|--------|
| 25 | [The process: communication, edge cases, debugging](25-interview-process.md) |
| 26 | [Synthesis: mock week and progress tracker](26-synthesis.md) |

## What you should end up with

- You estimate time and memory **complexity** before and after the code.
- You recognize the **pattern** within 3–5 minutes of reading the statement.
- You write **clean** Python code: typing, clear names, without unnecessary classes.
- You cover a **standard set** of ~60–80 problems (easy/medium) over the course.
- You pass a 45-min **mock**: statement → approach → code → tests.

## Materials

| File | Purpose |
|------|------------|
| [interview-cheatsheet.md](interview-cheatsheet.md) | cheat sheet before the interview |
| [examples/](examples/pyproject.toml) | code + pytest |

## Related to mock-exams

| Skill | Course |
|-------|------|
| pytest, TDD | [python-testing](../python-testing/README.md) |
| System design | [microservices-patterns](../microservices-patterns/README.md), [fastapi/40](../fastapi/40-system-design.md) |
| Async / concurrency (rare in algo) | [python-async](../python-async/README.md) |
