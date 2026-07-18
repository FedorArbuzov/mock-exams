# Python Deep Dive

Подробный курс **устройства Python** для собеседований и сильного middle+/senior backend: **CPython**, **GIL**, память и GC, объектная модель, **descriptors**, MRO, декораторы, генераторы, import, typing и типичные **interview Q&A**. Формат «книги» с **подзадачами**; лабы — [`examples/`](examples/pyproject.toml) + pytest.

**Для кого:** backend на Python после [fastapi](../fastapi/README.md) / [django](../django/README.md); перед интервью, где спрашивают «как устроен Python», не только фреймворк.

**Предварительно:**

| Навык | Зачем |
|-------|--------|
| Python 3.11+ в проде или pet-проекте | базовый синтаксис |
| Один backend-курс | контекст web/async |

**Полезно:** [python-async](../python-async/README.md) (asyncio углублённо), [python-algorithms](../python-algorithms/README.md), [behavioral-interviews](../behavioral-interviews/README.md).

## Как читать

- Главы **01–20** — ~**45–60 мин** (теория + **подзадачи** + код в `examples/`).
- Главы **21–22** — interview bank и **mock** (**2–3 ч**).
- Запускайте примеры в REPL и `dis.dis()` — курс про **механику**, не про заучивание.

**Время:** ~**22–30 часов**.

## Локальная практика

```bash
cd courses/python-deep-dive/examples
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
pytest -v
```

## Программа

### Часть I — Исполнение и память (01–04)

| № | Глава |
|---|--------|
| 01 | [CPython: как выполняется код](01-cpython-execution.md) |
| 02 | [GIL: потоки, процессы, async](02-gil.md) |
| 03 | [Память, ссылки, сборка мусора](03-memory-gc.md) |
| 04 | [Объекты, type, class, MRO](04-object-model.md) |

### Часть II — Язык в глубину (05–10)

| № | Глава |
|---|--------|
| 05 | [Mutability, copy, `is` vs `==`](05-mutability-copy.md) |
| 06 | [Функции: closure, decorator](06-functions-decorators.md) |
| 07 | [Итераторы и генераторы](07-iterators-generators.md) |
| 08 | [Context managers](08-context-managers.md) |
| 09 | [Исключения](09-exceptions.md) |
| 10 | [Import system](10-import-system.md) |

### Часть III — Продвинутая модель (11–16)

| № | Глава |
|---|--------|
| 11 | [Descriptors и `property`](11-descriptors.md) |
| 12 | [Data model: dunder methods](12-dunder-methods.md) |
| 13 | [Metaclasses (когда и зачем)](13-metaclasses.md) |
| 14 | [`__slots__` и память](14-slots.md) |
| 15 | [Typing, Protocol, ABC](15-typing-protocols.md) |
| 16 | [weakref и циклические ссылки](16-weakref.md) |

### Часть IV — Concurrency и perf (17–20)

| № | Глава |
|---|--------|
| 17 | [threading vs multiprocessing](17-threading-multiprocessing.md) |
| 18 | [asyncio с точки зрения CPython](18-asyncio-internals.md) |
| 19 | [Профилирование и оптимизация](19-profiling.md) |
| 20 | [Packaging, venv, интерпретаторы](20-packaging.md) |

### Часть V — Интервью (21–22)

| № | Глава |
|---|--------|
| 21 | [Interview Q&A: топ вопросов](21-interview-qa.md) |
| 22 | [Синтез: mock Python round](22-synthesis.md) |

## Что должно получиться

- Объясняете **GIL** и выбор threads / processes / asyncio.
- Рисуете **reference counting + GC** для циклов.
- Пишете **descriptor** и объясняете, как работает `property`.
- Знаете **MRO** и порядок `super()`.
- Отвечаете на **20+** типичных Python interview questions за 2–4 минуты каждый.

## Материалы

| Файл | Назначение |
|------|------------|
| [interview-cheatsheet.md](interview-cheatsheet.md) | шпаргалка |
| [examples/](examples/pyproject.toml) | лабы |

## Связь с курсами

| Тема | Курс |
|------|------|
| asyncio практика | [python-async](../python-async/README.md) |
| FastAPI async | [fastapi/27](../fastapi/27-async-patterns.md) |
| Алгоритмы | [python-algorithms](../python-algorithms/README.md) |
| OOD на интервью | [ood-python](../ood-python/README.md) |
| Тесты | [python-testing](../python-testing/README.md) |
