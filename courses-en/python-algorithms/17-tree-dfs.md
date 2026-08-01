# 17. DFS on trees: path, diameter, LCA

## Intro

DFS returns a value **bottom-up**: height, path, sum. **Global/state** for diameter and max path sum.

---

## Diameter (longest path)

```python
def diameter(root: TreeNode | None) -> int:
    best = 0

    def height(node: TreeNode | None) -> int:
        nonlocal best
        if not node:
            return 0
        l = height(node.left)
        r = height(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)

    height(root)
    return best
```

---

## Path sum II (all paths)

Backtracking: push on entry, pop on exit.

---

## LCA binary tree (general)

```python
def lca(root: TreeNode | None, p: TreeNode, q: TreeNode) -> TreeNode | None:
    if not root or root is p or root is q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root
    return left or right
```

---

## Subtasks

**Time:** ~75 min.

### 17.1 Max path sum (25 min)

Global best, not necessarily through the root — code.

### 17.2 Diameter (15 min)

Code above.

### 17.3 LCA (15 min)

Recursive + explanation.

### 17.4 Count good nodes (20 min)

DFS with max_so_far from the root.

---

## Checklist

- [ ] nonlocal/global for aggregate?
- [ ] Backtracking path with pop?

**Next:** [18. Graphs](18-graphs-bfs-dfs.md).
