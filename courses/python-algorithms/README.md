# Python Algorithms — подготовка к алгоритмической секции

Подробный курс **алгоритмов и структур данных на Python** для live-coding и take-home: сложность, паттерны, шаблоны кода, разбор типовых задач и **подзадачи** в каждой главе. Практика — локально в venv, [`examples/`](examples/pyproject.toml) + pytest.

**Для кого:** backend Python-разработчики перед собеседованием (Яндекс, Avito, Ozon, международные Big Tech, стартапы); инженеры после [fastapi](../fastapi/README.md) / [django](../django/README.md), которым нужна **отдельная** алгоритмическая подготовка.

**Предварительно:**

| Навык | Зачем |
|-------|--------|
| Python 3.11+ | синтаксис, typing, venv |
| Базовые структуры данных | список, dict, set — на уровне «пользовался в проекте» |

**Полезно параллельно:** [python-testing](../python-testing/README.md) (pytest), [python-deep-dive](../python-deep-dive/README.md) (GIL, memory, descriptors), [ood-python](../ood-python/README.md) (LRU, rate limiter OOD), [microservices-patterns](../microservices-patterns/README.md) (system design), [behavioral-interviews](../behavioral-interviews/README.md) (soft skills).

## Как читать

- Главы **01–24** — ~**50–70 мин** (теория + **подзадачи** + 1–3 задачи в коде).
- Главы **25–26** — процесс интервью и **mock-неделя** (**4–6 ч**).
- Сначала **прочитайте паттерн**, затем **закройте IDE** и решите подзадачу на бумаге/доске, потом код в `examples/`.
- Ведите **ошибочную тетрадь**: что забыли (edge case, off-by-one, сложность).

**Время:** ~**35–45 часов** (полный проход с кодом).

## Локальная практика

```bash
cd courses/python-algorithms/examples
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest                    # все тесты
pytest tests/test_ch05.py -v
```

Структуры `ListNode` / `TreeNode`: [`examples/algo/structures.py`](examples/algo/structures.py).

## Программа

### Часть I — Основа (01–04)

| № | Глава |
|---|--------|
| 01 | [Ландшафт интервью и план подготовки](01-interview-landscape.md) |
| 02 | [Сложность: Big-O, амортизация, мастер-теорема](02-complexity.md) |
| 03 | [Python для алгоритмов: stdlib и идиомы](03-python-stdlib.md) |
| 04 | [Как узнавать паттерн задачи](04-pattern-recognition.md) |

### Часть II — Массивы и строки (05–08)

| № | Глава |
|---|--------|
| 05 | [Two pointers](05-two-pointers.md) |
| 06 | [Sliding window](06-sliding-window.md) |
| 07 | [Prefix sum и difference array](07-prefix-sum.md) |
| 08 | [Строки: hashing, anagram, palindrome](08-strings.md) |

### Часть III — Хеширование и поиск (09–11)

| № | Глава |
|---|--------|
| 09 | [Hash map / set паттерны](09-hash-map.md) |
| 10 | [Сортировки и когда какую](10-sorting.md) |
| 11 | [Бинарный поиск и bisect](11-binary-search.md) |

### Часть IV — Линейные структуры (12–14)

| № | Глава |
|---|--------|
| 12 | [Stack и queue](12-stack-queue.md) |
| 13 | [Linked list](13-linked-list.md) |
| 14 | [Monotonic stack / deque](14-monotonic-stack.md) |

### Часть V — Деревья (15–17)

| № | Глава |
|---|--------|
| 15 | [Обходы дерева: DFS, BFS](15-tree-traversals.md) |
| 16 | [BST: поиск, вставка, валидация](16-bst.md) |
| 17 | [DFS на деревьях: path, diameter, LCA](17-tree-dfs.md) |

### Часть VI — Графы (18–19)

| № | Глава |
|---|--------|
| 18 | [Граф: BFS, DFS, матрица смежности](18-graphs-bfs-dfs.md) |
| 19 | [Topological sort, Union-Find](19-topo-union-find.md) |

### Часть VII — Продвинутое (20–24)

| № | Глава |
|---|--------|
| 20 | [Heap / priority queue](20-heap.md) |
| 21 | [Интервалы: merge, insert](21-intervals.md) |
| 22 | [Динамическое программирование 1D](22-dp-1d.md) |
| 23 | [DP 2D и knapsack](23-dp-2d.md) |
| 24 | [Greedy и backtracking](24-greedy-backtracking.md) |

### Часть VIII — Интервью (25–26)

| № | Глава |
|---|--------|
| 25 | [Процесс: коммуникация, edge cases, отладка](25-interview-process.md) |
| 26 | [Синтез: mock-неделя и трекер прогресса](26-synthesis.md) |

## Что должно получиться

- Оцениваете **сложность** времени и памяти до кода и после.
- Узнаёте **паттерн** за 3–5 минут чтения условия.
- Пишете на Python **чистый** код: typing, понятные имена, без лишних классов.
- Закрываете **типовой набор** ~60–80 задач (easy/medium) за курс.
- Проходите **mock** 45 мин: условие → подход → код → тесты.

## Материалы

| Файл | Назначение |
|------|------------|
| [interview-cheatsheet.md](interview-cheatsheet.md) | шпаргалка перед интервью |
| [examples/](examples/pyproject.toml) | код + pytest |

## Связь с mock-exams

| Навык | Курс |
|-------|------|
| pytest, TDD | [python-testing](../python-testing/README.md) |
| System design | [microservices-patterns](../microservices-patterns/README.md), [fastapi/40](../fastapi/40-system-design.md) |
| Async / concurrency (редко в algo) | [python-async](../python-async/README.md) |
