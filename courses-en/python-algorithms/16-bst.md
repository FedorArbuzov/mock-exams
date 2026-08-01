# 16. BST: search, insert, validation

## Intro

BST: left < root < right. Inorder — **sorted**. Search/insert O(h); balanced O(log n), skewed O(n).

---

## Search / insert

```python
def search(root: TreeNode | None, val: int) -> TreeNode | None:
    cur = root
    while cur:
        if val == cur.val:
            return cur
        cur = cur.left if val < cur.val else cur.right
    return None
```

---

## Validate BST

Pass `(min, max)` bounds — not just a comparison with the immediate parent.

```python
def is_valid(node: TreeNode | None, lo: float = float("-inf"), hi: float = float("inf")) -> bool:
    if not node:
        return True
    if not (lo < node.val < hi):
        return False
    return is_valid(node.left, lo, node.val) and is_valid(node.right, node.val, hi)
```

---

## Kth smallest

Inorder — the k-th element; or a BST with size in each node (rare).

---

## Subtasks

**Time:** ~65 min.

### 16.1 Validate BST (15 min)

Code with bounds.

### 16.2 Kth smallest (15 min)

Iterative inorder with a counter.

### 16.3 LCA in BST (20 min)

O(h) comparing val with p,q.

### 16.4 Convert sorted array to BST (15 min)

Mid as root, recursive.

---

## Checklist

- [ ] Validate uses min/max range?
- [ ] Inorder = sorted for the check?

**Next:** [17. Tree DFS](17-tree-dfs.md).
