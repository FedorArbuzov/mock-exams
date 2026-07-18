# OOD Python — объектно-ориентированный дизайн на собеседовании

Курс **OOD live-coding** на Python: **SOLID**, композиция, паттерны, классические задачи (parking lot, LRU, rate limiter) и **подзадачи** в каждой главе. Практика — [`examples/`](examples/pyproject.toml) + pytest.

**Для кого:** backend Python middle+; раунды «спроектируйте классы» после или вместо второй алго-задачи.

**Предварительно:**

| Навык | Зачем |
|-------|--------|
| Python ООП | классы, наследование, typing |
| [python-deep-dive](../python-deep-dive/README.md) главы 04, 11–15 | MRO, Protocol, dunder |

**Полезно:** [python-algorithms](../python-algorithms/README.md), [api-design](../api-design/README.md), [behavioral-interviews](../behavioral-interviews/README.md).

## Как читать

- Главы **01–18** — ~**50–65 мин** (теория + подзадачи + код).
- Главы **19–20** — mock OOD + **capstone** (**3–4 ч**).
- На интервью: **сначала** требования и API, **потом** классы; не молчать.

**Время:** ~**20–28 часов**.

## Локальная практика

```bash
cd courses/ood-python/examples
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
pytest -v
```

## Программа

### Часть I — Основа (01–04)

| № | Глава |
|---|--------|
| 01 | [Ландшафт OOD-раунда](01-landscape.md) |
| 02 | [SOLID на Python](02-solid.md) |
| 03 | [Композиция, ABC, Protocol](03-composition-interfaces.md) |
| 04 | [Процесс: 45 минут OOD интервью](04-interview-process.md) |

### Часть II — Паттерны (05–09)

| № | Глава |
|---|--------|
| 05 | [Creational: factory, builder, singleton](05-creational.md) |
| 06 | [Structural: adapter, facade, composite](06-structural.md) |
| 07 | [Behavioral: strategy, observer, state](07-behavioral.md) |
| 08 | [Repository, service, domain layer](08-layering.md) |
| 09 | [Когда паттерн не нужен](09-anti-patterns.md) |

### Часть III — Классические задачи (10–17)

| № | Глава |
|---|--------|
| 10 | [Parking Lot](10-parking-lot.md) |
| 11 | [LRU Cache](11-lru-cache.md) |
| 12 | [Rate Limiter](12-rate-limiter.md) |
| 13 | [In-memory Bookstore / Catalog](13-bookstore.md) |
| 14 | [Meeting Room Scheduler](14-meeting-scheduler.md) |
| 15 | [Vending Machine (state)](15-vending-machine.md) |
| 16 | [Deck of Cards / Blackjack lite](16-deck-cards.md) |
| 17 | [URL Shortener (OOD slice)](17-url-shortener.md) |

### Часть IV — Синтез (18–20)

| № | Глава |
|---|--------|
| 18 | [UML и тесты для OOD](18-uml-testing.md) |
| 19 | [Interview Q&A](19-interview-qa.md) |
| 20 | [Синтез: mock + capstone](20-synthesis.md) |

## Что должно получиться

- За 5 минут выписываете **сущности, API, расширения**.
- Реализуете **LRU** и **rate limiter** с тестами.
- Объясняете **SOLID** на своём классе.
- Проходите **mock OOD 45 мин** с rubric ≥3/4.

## Материалы

| Файл | Назначение |
|------|------------|
| [interview-cheatsheet.md](interview-cheatsheet.md) | шпаргалка |
| [examples/](examples/pyproject.toml) | LRU, rate limit, parking |

## Связь с курсами

| Тема | Курс |
|------|------|
| Дескрипторы, Protocol | [python-deep-dive](../python-deep-dive/README.md) |
| API design | [api-design](../api-design/README.md) |
| Алгоритмы внутри OOD | [python-algorithms](../python-algorithms/README.md) |
| Тесты | [python-testing](../python-testing/README.md) |
