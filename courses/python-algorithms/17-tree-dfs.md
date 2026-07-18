# 17. DFS на деревьях: path, diameter, LCA

## Введение

DFS возвращает значение **снизу вверх**: высота, путь, сумма. **Global/state** для diameter и max path sum.

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

## Path sum II (все пути)

Backtracking: push на вход, pop на выход.

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

## Подзадачи

**Время:** ~75 мин.

### 17.1 Max path sum (25 мин)

Global best, не обязательно через root — код.

### 17.2 Diameter (15 мин)

Код выше.

### 17.3 LCA (15 мин)

Recursive + объяснение.

### 17.4 Count good nodes (20 мин)

DFS с max_so_far от root.

---

## Чек-лист

- [ ] nonlocal/global для aggregate?
- [ ] Backtracking path с pop?

**Дальше:** [18. Графы](18-graphs-bfs-dfs.md).
