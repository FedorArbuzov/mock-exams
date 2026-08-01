# 15. Tree traversals: DFS, BFS

## Intro

Binary tree — recursion or a stack (DFS), a queue (BFS level order). Three orders: preorder, inorder, postorder.

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

## Subtasks

**Time:** ~70 min.

### 15.1 Three traversals (15 min)

Preorder/inorder/postorder — recursive without hints.

### 15.2 Zigzag level order (20 min)

BFS + reverse alternate levels.

### 15.3 Serialize/deserialize (25 min)

BFS or preorder with `None` markers.

### 15.4 Invert binary tree (10 min)

Swap children recursively.

---

## Checklist

- [ ] BFS for loop `len(q)`?
- [ ] Base `if not node`?

**Next:** [16. BST](16-bst.md).
