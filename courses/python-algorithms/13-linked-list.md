# 13. Linked list

## Введение

Указатели `next` — O(1) insert после известного узла; нет random access. На интервью: reverse, merge, cycle, middle.

Структуры: [`examples/algo/structures.py`](examples/algo/structures.py).

---

## Reverse

```python
def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
```

---

## Floyd cycle

Slow 1 step, fast 2 — встреча ⇒ cycle. Начало цикла: reset slow to head, оба по 1.

---

## Merge two sorted lists

Dummy node + tail pointer — избегает edge head.

---

## Подзадачи

**Время:** ~70 мин.

### 13.1 Reverse (15 мин)

Iterative + recursive (если уверенны в stack depth).

### 13.2 Merge k lists (25 мин)

heapq с (val, i, node) — O(N log k).

### 13.3 Remove nth from end (15 мин)

Two pointers с gap n.

### 13.4 Reorder list (15 мин)

Find middle, reverse second half, merge.

---

## Чек-лист

- [ ] Dummy node для merge?
- [ ] Cycle detection O(1) space?

**Дальше:** [14. Monotonic stack](14-monotonic-stack.md).
