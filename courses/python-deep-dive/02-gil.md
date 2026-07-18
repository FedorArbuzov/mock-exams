# 02. GIL: потоки, процессы, async

## Введение

**Global Interpreter Lock** — mutex в CPython, один поток выполняет Python bytecode в процессе. На интервью спрашивают **каждый второй** middle Python backend.

Углубление async: [python-async/01](../python-async/01-sync-vs-async.md).

---

## Что делает GIL

| | С GIL |
|--|-------|
| CPU-bound threads | **не** параллелят на ядрах |
| I/O-bound threads | ок — GIL отпускается на wait |
| multiprocessing | отдельные процессы — **свой** GIL |

```text
Process
  ├─ Thread 1 ─┐
  └─ Thread 2 ─┴─ один GIL на bytecode
```

---

## Когда что

| Задача | Инструмент |
|--------|------------|
| HTTP fan-out | **asyncio** или threads |
| CPU crunch | **multiprocessing**, C ext, Rust |
| Mixed | async + ProcessPoolExecutor |

---

## GIL «снимут»?

**PEP 703** (nogil, 3.13+ experimental) — знайте тренд; на интервью 2025–2026: «CPython с GIL, для CPU — processes».

---

## Подзадачи

**Время:** ~55 мин.

### 2.1 Таблица (15 мин)

5 задач из вашего опыта → thread/process/async.

### 2.2 Устно (20 мин)

Ответ 2 мин: «Что такое GIL и когда мешает?»

### 2.3 Мифы (10 мин)

3 мифа (async обходит GIL для CPU — нет) + правда.

### 2.4 Code smell (10 мин)

`time.sleep` в async def — почему плохо ([fastapi/27](../fastapi/27-async-patterns.md)).

---

## Чек-лист

- [ ] I/O vs CPU разведены?
- [ ] Знаете ProcessPool для CPU?

**Дальше:** [03. Память и GC](03-memory-gc.md).
