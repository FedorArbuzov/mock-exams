# 18. Граф: BFS, DFS, матрица смежности

## Введение

Граф: `adj: dict[int, list[int]]` или grid (4/8 соседей). **Visited** set обязателен. BFS — кратчайший путь в невзвешенном графе.

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

## Подзадачи

**Время:** ~75 мин.

### 18.1 Number of islands (20 мин)

DFS flood fill на grid.

### 18.2 Clone graph (15 мин)

DFS + dict old→new.

### 18.3 Course schedule (can finish) (20 мин)

Detect cycle directed graph — DFS 3-color или topo.

### 18.4 Word ladder (20 мин)

BFS по словам — опционально bidirectional BFS.

---

## Чек-лист

- [ ] visited при DFS/BFS?
- [ ] Grid bounds check?

**Дальше:** [19. Topo и Union-Find](19-topo-union-find.md).
