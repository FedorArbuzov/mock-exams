# 18. asyncio с точки зрения CPython

## Введение

Не дублируем [python-async](../python-async/README.md) — здесь **механика**: coroutine object, event loop, `await` = yield control.

---

## Coroutine

```python
async def f():
    return 1

c = f()       # coroutine object, not 1
```

`await c` schedules on event loop.

---

## Event loop

```text
loop.run_until_complete(main())
  → run ready tasks
  → on await I/O: register fd, yield
  → callback when ready
```

Default policy: `asyncio.run()` (3.7+).

---

## Tasks and futures

`asyncio.create_task` — concurrent coroutines on **one** thread.

**Не путать** с threads: cooperative multitasking.

---

## Blocking in async

`time.sleep`, sync `requests` — **блокируют loop**. `await asyncio.sleep`, `httpx` async.

---

## Подзадачи

**Время:** ~50 мин.

### 18.1 Trace (15 мин)

`asyncio.run` с двумя `await sleep` — порядок вывода.

### 18.2 Block demo (15 мин)

`time.sleep(1)` inside async — замер delay других tasks.

### 18.3 Bridge (20 мин)

Список глав python-async для практики после этой главы.

---

## Чек-лист

- [ ] coroutine vs function call?
- [ ] blocking kills loop?

**Дальше:** [19. Profiling](19-profiling.md).
