# 18. Graph: BFS, DFS, adjacency matrix

## Intro

Graph: `adj: dict[int, list[int]]` or a grid (4/8 neighbors). A **visited** set is mandatory. BFS — the shortest path in an unweighted graph.

---

## DFS (components)

```python
def count_components(n: int, edges: list[list[int]]) -> int:
    adj: dict[int, list[int]] = defaultdict(list)
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen: set[int] = set()

    def dfs(v: int) -> None:
        seen.add(v)
        for u in adj[v]:
            if u not in seen:
                dfs(u)

    comps = 0
    for v in range(n):
        if v not in seen:
            dfs(v)
            comps += 1
    return comps
```

---

## BFS shortest path (unweighted)

```python
def bfs_dist(start: int, adj: dict[int, list[int]]) -> dict[int, int]:
    dist = {start: 0}
    q = deque([start])
    while q:
        v = q.popleft()
        for u in adj[v]:
            if u not in dist:
                dist[u] = dist[v] + 1
                q.append(u)
    return dist
```

---

## Grid as graph

```python
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
for dr, dc in DIRS:
    nr, nc = r + dr, c + dc
```

---

## Subtasks

**Time:** ~75 min.

### 18.1 Number of islands (20 min)

DFS flood fill on a grid.

### 18.2 Clone graph (15 min)

DFS + dict old→new.

### 18.3 Course schedule (can finish) (20 min)

Detect a cycle in a directed graph — DFS 3-color or topo.

### 18.4 Word ladder (20 min)

BFS over words — optionally bidirectional BFS.

---

## Checklist

- [ ] visited during DFS/BFS?
- [ ] Grid bounds check?

**Next:** [19. Topo and Union-Find](19-topo-union-find.md).
