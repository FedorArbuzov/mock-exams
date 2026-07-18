# 03. Python для алгоритмов: stdlib и идиомы

## Введение

На интервью разрешён Python — используйте **stdlib**, не изобретайте deque/hash. Эта глава — «арсенал», который должен быть в мышечной памяти.

---

## collections

```python
from collections import Counter, defaultdict, deque

cnt = Counter("abracadabra")  # частоты
graph: dict[int, list[int]] = defaultdict(list)
q: deque[int] = deque([0])
q.append(1)
x = q.popleft()  # O(1)
```

| Тип | Когда |
|-----|-------|
| `deque` | BFS, sliding window max (с monotonic) |
| `Counter` | анаграммы, частоты |
| `defaultdict` | граф, группировка |

---

## heapq (min-heap)

```python
import heapq

h = [3, 1, 4]
heapq.heapify(h)           # O(n)
heapq.heappush(h, 2)
smallest = heapq.heappop(h)  # O(log n)

# max-heap: инвертировать знак
heapq.heappush(h, -val)
```

`heapq.nlargest(k, nums)` — O(n log k).

---

## bisect (бинарный поиск в sorted)

```python
import bisect

nums = [1, 3, 3, 5]
i = bisect.bisect_left(nums, 3)   # 1
bisect.insort(nums, 4)
```

---

## itertools

```python
from itertools import accumulate, permutations, combinations

prefix = list(accumulate(nums))  # prefix sum
```

---

## functools

```python
from functools import cache, lru_cache

@cache
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```

Для DP с **изменяемыми** аргументами — `lru_cache` не подойдёт; таблица вручную.

---

## Полезные приёмы

```python
# swap
a, b = b, a

# enumerate с start
for i, x in enumerate(nums, start=1):

# sort с key
sorted(words, key=lambda w: (-len(w), w))

# inf
best = float("inf")

# divmod для координат сетки
r, c = divmod(idx, cols)
```

---

## typing на интервью

```python
def solve(grid: list[list[int]]) -> int:
    ...
```

Достаточно `list`, `dict`, `Optional` — не усложняйте `TypeVar`.

---

## Подзадачи

**Время:** ~60 мин.

### 3.1 Snippet drill (20 мин)

Без IDE напишите с нуля: `deque` BFS обход списка соседей; `Counter` для проверки анаграммы; `heappush`/`heappop` для 3 smallest.

### 3.2 bisect (10 мин)

В sorted массиве найти **первый** индекс `>= target` — одна строка с `bisect`.

### 3.3 @cache (10 мин)

Fibonacci с `@cache` — time/space? Когда снять cache на интервью (размер state)?

### 3.4 Рефактор (10 мин)

Замените `list.pop(0)` в BFS на `deque` — почему?

### 3.5 Cheat sheet (10 мин)

В `mistakes.md` добавьте 5 строк «stdlib → задача» (heap → k-th largest, …).

---

## Резюме

`deque`, `heapq`, `bisect`, `Counter`, `defaultdict`, `@cache` — 80% инфраструктуры решений.

---

## Чек-лист

- [ ] BFS только с deque?
- [ ] Знаете max-heap через минус?
- [ ] bisect_left vs bisect_right?

**Дальше:** [04. Узнавание паттерна](04-pattern-recognition.md).
