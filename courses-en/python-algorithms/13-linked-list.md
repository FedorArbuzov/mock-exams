# 13. Linked list

## Intro

`next` pointers — O(1) insert after a known node; no random access. At the interview: reverse, merge, cycle, middle.

Structures: [`examples/algo/structures.py`](examples/algo/structures.py).

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

Slow 1 step, fast 2 — a meeting ⇒ cycle. Start of the cycle: reset slow to head, both move by 1.

---

## Merge two sorted lists

Dummy node + tail pointer — avoids the head edge case.

---

## Subtasks

**Time:** ~70 min.

### 13.1 Reverse (15 min)

Iterative + recursive (if you're confident about stack depth).

### 13.2 Merge k lists (25 min)

heapq with (val, i, node) — O(N log k).

### 13.3 Remove nth from end (15 min)

Two pointers with a gap of n.

### 13.4 Reorder list (15 min)

Find middle, reverse the second half, merge.

---

## Checklist

- [ ] Dummy node for merge?
- [ ] Cycle detection O(1) space?

**Next:** [14. Monotonic stack](14-monotonic-stack.md).
