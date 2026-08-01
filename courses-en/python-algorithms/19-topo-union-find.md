# 19. Topological sort, Union-Find

## Intro

**Topo sort** — a DAG into a linear order (courses, dependencies). **Union-Find (DSU)** — components, "in the same group?", Kruskal.

---

## Kahn (BFS indegree)

```python
def topo_sort(n: int, edges: list[list[int]]) -> list[int]:
    indeg = [0] * n
    adj: dict[int, list[int]] = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []  # cycle
```

---

## Union-Find

```python
class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True
```

---

## Subtasks

**Time:** ~70 min.

### 19.1 Course schedule II (20 min)

Topo order or empty.

### 19.2 Redundant connection (20 min)

The last edge that forms a cycle — DSU.

### 19.3 Number of provinces (15 min)

DFS or DSU on a matrix.

### 19.4 Alien dictionary (15 min)

Topo on a graph of letters — hard sketch.

---

## Checklist

- [ ] Topo detects cycle (len order)?
- [ ] DSU path compression?

**Next:** [20. Heap](20-heap.md).
