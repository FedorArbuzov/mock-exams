# 22. Синтез: mock Python round

## Финальное задание

**Mock Python deep dive** — 45–60 мин (сам или с коллегой). Rubric + повторение лаб.

**Время:** ~**2–3 ч**.

---

## Формат mock

| Блок | Мин | Содержание |
|------|-----|------------|
| Warm-up | 5 | tell me your Python stack |
| Q&A | 25 | 8–10 вопросов из [21](21-interview-qa.md) |
| Live code | 15 | descriptor ИЛИ decorator ИЛИ generator |
| Follow-up | 10 | GIL / memory / async choice для задачи |

---

## Live code (выберите одно)

1. **Decorator** `retry(times=3)` с `functools.wraps`
2. **Descriptor** validated field (как `Positive`)
3. **Generator** pipeline: read numbers → running max → yield
4. **Context manager** timer

Проверка: `pytest` в [`examples/`](examples/pyproject.toml).

---

## Rubric (1–4)

| Балл | Критерий |
|------|----------|
| 1 | неверно / «не знаю» без структуры |
| 2 | частично, без depth |
| 3 | верно, примеры, связь с практикой |
| 4 | + trade-offs, знает главы 17–18, честные limits |

**Hire bar middle:** среднее ≥3 на Q&A; live code работает.

---

## Deliverable: Python Interview Sheet

Одна страница (создайте `python-interview-sheet.md`):

| Секция | Содержание |
|--------|------------|
| GIL | 3 предложения |
| Memory | refcount + GC |
| Concurrency | таблица task→tool |
| Top 5 weak topics | + ссылка на главу |
| Mock score | дата, балл |
| Lab status | pytest green? |

---

## Карта курса

```text
01–04   CPython, GIL, memory, MRO
05–10   mutability, functions, iter, CM, except, import
11–16   descriptor, dunder, meta, slots, typing, weakref
17–20   threads, async view, profile, packaging
21–22   Q&A, mock
```

---

## Подзадачи

### 22.1 Labs (30 мин)

Все `examples/` green (скопируйте из `solutions/` только после своей попытки).

### 22.2 Sheet (30 мин)

Заполните Python Interview Sheet.

### 22.3 Mock (45 мин)

Прогон по формату; запись баллов.

### 22.4 Retake (30 мин)

Повторите 3 слабых вопроса через неделю (запланируйте).

---

## В mock-exams — полный interview stack

| Раунд | Курс |
|-------|------|
| Algorithms | [python-algorithms](../python-algorithms/README.md) |
| Python depth | этот курс |
| Framework | [fastapi](../fastapi/README.md) / [django](../django/README.md) |
| Design | [microservices-patterns](../microservices-patterns/README.md) |
| Behavioral | [behavioral-interviews](../behavioral-interviews/README.md) |

---

## Чек-лист курса

- [ ] Главы 01–20 подзадачи сделаны?
- [ ] pytest examples green?
- [ ] 21-interview ≥15/21?
- [ ] Mock проведён?
- [ ] [interview-cheatsheet](interview-cheatsheet.md) перед интервью?

**Курс завершён.**
