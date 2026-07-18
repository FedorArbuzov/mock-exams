# 12. Stack и queue

## Введение

**Stack** — LIFO: скобки, DFS iterative, монотонный стек. **Queue** — FIFO: BFS; в Python только `collections.deque`.

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

Стек операндов: число push, оператор pop два.

---

## Queue BFS

```python
q = deque([start])
while q:
    node = q.popleft()
    ...
```

---

## Подзадачи

**Время:** ~65 мин.

### 12.1 Valid parentheses (10 мин)

Код + edge `""`, `"("`.

### 12.2 Min stack (20 мин)

Два стека или tuple (val, min_so_far).

### 12.3 Daily temperatures (20 мин)

Monotonic stack — next greater element.

### 12.4 Implement queue using stacks (15 мин)

Два стека — amortized O(1) push/pop.

---

## Чек-лист

- [ ] Stack для matching brackets?
- [ ] BFS только deque?

**Дальше:** [13. Linked list](13-linked-list.md).
