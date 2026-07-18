# 16. BST: поиск, вставка, валидация

## Введение

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

Передавать `(min, max)` bounds — не только сравнение с прямым родителем.

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

Inorder — k-й элемент; или BST с size в узле (редко).

---

## Подзадачи

**Время:** ~65 мин.

### 16.1 Validate BST (15 мин)

Код с bounds.

### 16.2 Kth smallest (15 мин)

Iterative inorder с счётчиком.

### 16.3 LCA in BST (20 мин)

O(h) сравнение val с p,q.

### 16.4 Convert sorted array to BST (15 мин)

Mid as root, recursive.

---

## Чек-лист

- [ ] Validate uses min/max range?
- [ ] Inorder = sorted для проверки?

**Дальше:** [17. DFS на деревьях](17-tree-dfs.md).
