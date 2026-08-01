# 12. Stack and queue

## Intro

**Stack** — LIFO: parentheses, iterative DFS, monotonic stack. **Queue** — FIFO: BFS; in Python only `collections.deque`.

---

## Valid parentheses

```python
def is_valid(s: str) -> bool:
    stack: list[str] = []
    pairs = {")": "(", "]": "[", "}": "{"}
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack
```

---

## Evaluate RPN

Stack of operands: push a number, pop two for an operator.

---

## Queue BFS

```python
q = deque([start])
while q:
    node = q.popleft()
    ...
```

---

## Subtasks

**Time:** ~65 min.

### 12.1 Valid parentheses (10 min)

Code + edge `""`, `"("`.

### 12.2 Min stack (20 min)

Two stacks or a tuple (val, min_so_far).

### 12.3 Daily temperatures (20 min)

Monotonic stack — next greater element.

### 12.4 Implement queue using stacks (15 min)

Two stacks — amortized O(1) push/pop.

---

## Checklist

- [ ] Stack for matching brackets?
- [ ] BFS only deque?

**Next:** [13. Linked list](13-linked-list.md).
