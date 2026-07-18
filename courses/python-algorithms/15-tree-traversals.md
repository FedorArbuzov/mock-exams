# 15. Обходы дерева: DFS, BFS

## Введение

Binary tree — рекурсия или стек (DFS), очередь (BFS level order). Три порядка: preorder, inorder, postorder.

---

## DFS recursive

```python
def inorder(root: TreeNode | None) -> list[int]:
    out: list[int] = []

    def go(node: TreeNode | None) -> None:
        if not node:
            return
        go(node.left)
        out.append(node.val)
        go(node.right)

    go(root)
    return out
```

---

## BFS level order

```python
def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    q = deque([root])
    levels = []
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        levels.append(level)
    return levels
```

---

## Max depth

`1 + max(depth(left), depth(right))` — O(n).

---

## Подзадачи

**Время:** ~70 мин.

### 15.1 Три обхода (15 мин)

Preorder/inorder/postorder — recursive без подсказок.

### 15.2 Zigzag level order (20 мин)

BFS + reverse alternate levels.

### 15.3 Serialize/deserialize (25 мин)

BFS или preorder с `None` markers.

### 15.4 Invert binary tree (10 мин)

Swap children recursive.

---

## Чек-лист

- [ ] BFS for loop `len(q)`?
- [ ] Base `if not node`?

**Дальше:** [16. BST](16-bst.md).
